import { create } from 'zustand';
import { Instrument, StockWatchItem, Timeframe, CandleData } from '@/types';
import { POPULAR_NSE_INSTRUMENTS } from '@/services/api/instruments';
import { YahooFinanceClient } from '@/services/api/yahooFinanceClient';
import {
  calculateBaselineAverages,
  get1MinOpeningCandle,
  get5MinOpeningCandle,
  get15MinCumulativeVolume,
  calculateWholeDayMetrics,
  evaluateMorningBreakout,
  evaluateEveningCondition,
} from '@/services/engine/volumeEngine';
import { getCandleHistory, saveCandleHistory, saveEodRecord } from '@/services/storage/indexedDb';
import { getNowIST } from '@/services/engine/marketTime';
import { useSettingsStore } from './useSettingsStore';
import { useNotificationStore } from './useNotificationStore';

const WATCHLIST_STORAGE_KEY = 'stockobs_watchlist';

const DEFAULT_WATCHLIST_INSTRUMENTS: Instrument[] = [
  POPULAR_NSE_INSTRUMENTS[0], // RELIANCE
  POPULAR_NSE_INSTRUMENTS[1], // TCS
  POPULAR_NSE_INSTRUMENTS[2], // HDFCBANK
  POPULAR_NSE_INSTRUMENTS[3], // INFY
  POPULAR_NSE_INSTRUMENTS[6], // TMCV (Tata Motors Commercial)
];

const ALL_TIMEFRAMES: Timeframe[] = ['1min', '5min', '15min', 'daily', 'smacross', 'weekly', 'monthly'];

// Per-timeframe independent watchlist data
type TimeframeWatchlists = Record<Timeframe, StockWatchItem[]>;

interface StockStoreState {
  // Six independent sets of data — one per timeframe
  watchlists: TimeframeWatchlists;

  // Which tab the user is currently viewing
  activeTimeframe: Timeframe;

  // Unread breakout alert count per background timeframe (drives tab blinking)
  unreadByTimeframe: Record<Timeframe, number>;

  // Filter to show only stocks with active morning or EOD alerts
  filterAlertsOnly: boolean;

  isRefreshing: boolean;
  lastSyncTime: string | null;

  // Actions
  initWatchlist: () => Promise<void>;
  setTimeframe: (timeframe: Timeframe) => void;
  toggleFilterAlertsOnly: () => void;
  setFilterAlertsOnly: (val: boolean) => void;
  addStock: (instrument: Instrument) => Promise<void>;
  removeStock: (symbol: string) => void;
  syncAllTimeframes: () => Promise<void>;
  syncTimeframe: (tf: Timeframe) => Promise<void>;
  syncStock: (symbol: string, tf?: Timeframe) => Promise<void>;
  syncStockForTimeframe: (symbol: string, tf: Timeframe) => Promise<void>;
  runMorningSurveillance: (tf: Timeframe, simulateBreakout?: boolean) => Promise<void>;
  runEveningSurveillance: (tf: Timeframe, simulateBreakout?: boolean) => Promise<void>;
  clearTabUnread: (tf: Timeframe) => void;
}

function getYahooClient(): YahooFinanceClient {
  return new YahooFinanceClient(() => useSettingsStore.getState().demoMode);
}

function createEmptyWatchItem(instrument: Instrument): StockWatchItem {
  return {
    symbol: instrument.symbol,
    instrumentKey: instrument.instrumentKey,
    companyName: instrument.name,
    currentPrice: 0,
    change: 0,
    changePercent: 0,
    morningVolume: 0,
    morningRatio: 0,
    morningBreakout: false,
    wholeDayVolume: 0,
    wholeDayHigh: 0,
    eodRatio: 0,
    eodBreakout: false,
    baseline200Volume: 0,
    baseline200PriceHigh: 0,
    lastUpdated: new Date().toISOString(),
    status: 'idle',
  };
}

function emptyWatchlists(instruments: Instrument[]): TimeframeWatchlists {
  const items = instruments.map(createEmptyWatchItem);
  return {
    '1min': items.map(i => ({ ...i })),
    '5min': items.map(i => ({ ...i })),
    '15min': items.map(i => ({ ...i })),
    daily: items.map(i => ({ ...i })),
    smacross: items.map(i => ({ ...i })),
    weekly: items.map(i => ({ ...i })),
    monthly: items.map(i => ({ ...i })),
  };
}

function updateItemInTimeframe(
  watchlists: TimeframeWatchlists,
  tf: Timeframe,
  symbol: string,
  updater: (item: StockWatchItem) => StockWatchItem
): TimeframeWatchlists {
  return {
    ...watchlists,
    [tf]: watchlists[tf].map(item => (item.symbol === symbol ? updater(item) : item)),
  };
}

function getWatchlistInstruments(watchlists: TimeframeWatchlists): Instrument[] {
  return (watchlists['15min'] || watchlists['1min'] || []).map(s => ({
    symbol: s.symbol,
    instrumentKey: s.instrumentKey,
    name: s.companyName,
    segment: 'NSE_EQ',
    exchange: 'NSE',
  }));
}

export const useStockStore = create<StockStoreState>((set, get) => ({
  watchlists: { '1min': [], '5min': [], '15min': [], daily: [], smacross: [], weekly: [], monthly: [] },
  activeTimeframe: '15min',
  unreadByTimeframe: { '1min': 0, '5min': 0, '15min': 0, daily: 0, smacross: 0, weekly: 0, monthly: 0 },
  filterAlertsOnly: false,
  isRefreshing: false,
  lastSyncTime: null,

  toggleFilterAlertsOnly: () => {
    set(state => ({ filterAlertsOnly: !state.filterAlertsOnly }));
  },

  setFilterAlertsOnly: (val: boolean) => {
    set({ filterAlertsOnly: val });
  },

  // Switching the tab only changes the visible display — surveillance keeps running for all 4
  setTimeframe: (timeframe: Timeframe) => {
    set({ activeTimeframe: timeframe });
  },

  // Clear unread count when user navigates to that tab
  clearTabUnread: (tf: Timeframe) => {
    set(state => ({
      unreadByTimeframe: { ...state.unreadByTimeframe, [tf]: 0 },
    }));
  },

  initWatchlist: async () => {
    let savedInstruments: Instrument[] = [];
    try {
      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (raw) savedInstruments = JSON.parse(raw);
    } catch (e) {
      console.warn('[StockStore] Failed to load watchlist:', e);
    }
    if (!savedInstruments || savedInstruments.length === 0) {
      savedInstruments = DEFAULT_WATCHLIST_INSTRUMENTS;
    }

    set({ watchlists: emptyWatchlists(savedInstruments) });

    // Sync all 4 timeframes in parallel on startup
    await get().syncAllTimeframes();
  },

  addStock: async (instrument: Instrument) => {
    const existing = get().watchlists['15min'].find(s => s.symbol === instrument.symbol);
    if (existing) return;

    const newItem = createEmptyWatchItem(instrument);
    set(state => ({
      watchlists: {
        '1min': [...state.watchlists['1min'], { ...newItem }],
        '5min': [...state.watchlists['5min'], { ...newItem }],
        '15min': [...state.watchlists['15min'], { ...newItem }],
        daily: [...state.watchlists.daily, { ...newItem }],
        smacross: [...state.watchlists.smacross, { ...newItem }],
        weekly: [...state.watchlists.weekly, { ...newItem }],
        monthly: [...state.watchlists.monthly, { ...newItem }],
      },
    }));

    // Persist the full list
    const updatedInstruments = getWatchlistInstruments(get().watchlists);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updatedInstruments));

    // Fetch baselines for all 6 timeframes for the new stock
    await Promise.all(
      ALL_TIMEFRAMES.map(tf => get().syncStockForTimeframe(instrument.symbol, tf))
    );
  },

  removeStock: (symbol: string) => {
    set(state => ({
      watchlists: {
        '1min': state.watchlists['1min'].filter(s => s.symbol !== symbol),
        '5min': state.watchlists['5min'].filter(s => s.symbol !== symbol),
        '15min': state.watchlists['15min'].filter(s => s.symbol !== symbol),
        daily: state.watchlists.daily.filter(s => s.symbol !== symbol),
        smacross: state.watchlists.smacross.filter(s => s.symbol !== symbol),
        weekly: state.watchlists.weekly.filter(s => s.symbol !== symbol),
        monthly: state.watchlists.monthly.filter(s => s.symbol !== symbol),
      },
    }));
    const updatedInstruments = getWatchlistInstruments(get().watchlists);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updatedInstruments));
  },

  // Sync all 4 timeframes for all stocks concurrently
  syncAllTimeframes: async () => {
    set({ isRefreshing: true });
    await Promise.all(ALL_TIMEFRAMES.map(tf => get().syncTimeframe(tf)));
    set({ isRefreshing: false, lastSyncTime: new Date().toLocaleTimeString('en-IN') });
  },

  // Sync all stocks for one timeframe
  syncTimeframe: async (tf: Timeframe) => {
    const symbols = get().watchlists[tf].map(s => s.symbol);
    for (const sym of symbols) {
      await get().syncStockForTimeframe(sym, tf);
    }
  },

  syncStock: async (symbol: string, tf?: Timeframe) => {
    const targetTf = tf || get().activeTimeframe;
    await get().syncStockForTimeframe(symbol, targetTf);
  },

  syncStockForTimeframe: async (symbol: string, tf: Timeframe) => {
    const stock = get().watchlists[tf].find(s => s.symbol === symbol);
    if (!stock) return;

    const client = getYahooClient();
    const settings = useSettingsStore.getState();

    try {
      // 1. Get 200-period historical candles (cached in IndexedDB)
      let cached = await getCandleHistory(stock.instrumentKey, tf);
      let avgVolume = cached?.avgVolume || 0;
      let avgHigh = cached?.avgHigh || 0;
      let candles: CandleData[] = cached?.candles || [];

      const isStale =
        !cached ||
        Date.now() - new Date(cached.updatedAt).getTime() > 12 * 60 * 60 * 1000;

      if (isStale || candles.length === 0) {
        try {
          candles = await client.getHistoricalCandles(symbol, tf);
          const stats = calculateBaselineAverages(candles);
          avgVolume = stats.avgVolume;
          avgHigh = stats.avgHigh;
          await saveCandleHistory(stock.instrumentKey, tf, candles, avgVolume, avgHigh);
        } catch (apiErr) {
          console.warn(`[StockStore] Historical fetch failed for ${symbol} [${tf}]:`, apiErr);
          if (settings.demoMode) {
            candles = client.generateMockHistoricalCandles(symbol, tf);
            const stats = calculateBaselineAverages(candles);
            avgVolume = stats.avgVolume;
            avgHigh = stats.avgHigh;
          } else {
            avgVolume = 0;
            avgHigh = 0;
          }
        }
      }

      // 2. Intraday 1-min candles (always fetch fresh for today)
      let intradayCandles: CandleData[] = [];
      try {
        intradayCandles = await client.getIntraday1MinuteCandles(symbol);
      } catch (intraErr) {
        if (settings.demoMode) {
          intradayCandles = client.generateMockIntradayCandles(symbol);
        } else {
          intradayCandles = [];
        }
      }

      // 3. Extract morning volume depending on timeframe:
      // '1min'  -> 1st-minute opening candle (09:15:00)
      // '5min'  -> 5-minute opening candle (09:15:00-09:20:00)
      // '15min' -> 15-minute cumulative duration (09:15:00-09:30:00)
      // 'daily'/'weekly'/'monthly' -> today's total volume
      const wholeDayMetrics = calculateWholeDayMetrics(intradayCandles);

      let morningData: { volume: number; timestamp?: string };
      if (tf === '1min') {
        morningData = get1MinOpeningCandle(intradayCandles);
      } else if (tf === '5min') {
        morningData = get5MinOpeningCandle(intradayCandles);
      } else if (tf === '15min') {
        morningData = get15MinCumulativeVolume(intradayCandles);
      } else {
        morningData = { volume: wholeDayMetrics.totalVolume, timestamp: new Date().toISOString() };
      }

      // 4. Evaluate conditions
      // 'smacross' has a single condition only: day value >= 1x 200-period baseline
      const morningEval =
        tf === 'smacross'
          ? {
              isBreakout: false,
              isExtremeBreakout: false,
              isSmaBreakout: false,
              volume: 0,
              baseline: 0,
              ratio: 0,
            }
          : evaluateMorningBreakout(
              morningData.volume,
              avgVolume,
              settings.morningMultiplier
            );
      const eveningEval =
        tf === '1min'
          ? {
              isBreakout: false,
              currentValue: 0,
              baselineValue: 0,
              ratio: 0,
              metricType: 'volume' as const,
            }
          : evaluateEveningCondition(
              wholeDayMetrics.totalVolume,
              wholeDayMetrics.high,
              avgVolume,
              avgHigh,
              settings.eveningComparisonMode,
              tf === 'smacross' ? 1.0 : settings.eveningMultiplier
            );

      // Extract current / latest closing price and percentage change
      const lastClose = candles.length > 0 ? candles[candles.length - 1][4] : 0;
      const prevClose = candles.length > 1 ? candles[candles.length - 2][4] : lastClose;
      const resolvedPrice = wholeDayMetrics.lastPrice > 0 ? wholeDayMetrics.lastPrice : lastClose;
      const priceChange = prevClose > 0 ? Math.round((resolvedPrice - prevClose) * 100) / 100 : 0;
      const priceChangePercent =
        prevClose > 0
          ? Math.round(((resolvedPrice - prevClose) / prevClose) * 10000) / 100
          : 0;

      // 5. Update the specific timeframe's watchlist
      set(state => ({
        watchlists: updateItemInTimeframe(state.watchlists, tf, symbol, item => ({
          ...item,
          currentPrice: resolvedPrice || item.currentPrice,
          change: priceChange,
          changePercent: priceChangePercent,
          morningVolume: morningData.volume,
          morningCandleTimestamp: morningData.timestamp,
          morningRatio: morningEval.ratio,
          morningBreakout: morningEval.isBreakout,
          isExtremeBreakout: morningEval.isExtremeBreakout,
          isSmaBreakout: morningEval.isSmaBreakout,
          wholeDayVolume: wholeDayMetrics.totalVolume,
          wholeDayHigh: wholeDayMetrics.high,
          eodRatio: eveningEval.ratio,
          eodBreakout: eveningEval.isBreakout,
          baseline200Volume: avgVolume,
          baseline200PriceHigh: avgHigh,
          lastUpdated: new Date().toISOString(),
          status: morningEval.isExtremeBreakout
            ? 'morning_triggered'
            : morningEval.isSmaBreakout
            ? 'morning_triggered'
            : eveningEval.isBreakout
            ? 'eod_triggered'
            : 'idle',
        })),
      }));
    } catch (err) {
      console.error(`[StockStore] Error syncing ${symbol} [${tf}]:`, err);
    }
  },

  runMorningSurveillance: async (tf: Timeframe, simulateBreakout = false) => {
    // The SMA Cross tab only supports the EOD >=1x baseline condition
    if (tf === 'smacross') return;

    const client = getYahooClient();
    const settings = useSettingsStore.getState();
    const notifStore = useNotificationStore.getState();
    const { activeTimeframe } = get();

    for (const stock of get().watchlists[tf]) {
      let intradayCandles: CandleData[] = [];
      try {
        if (simulateBreakout) {
          intradayCandles = client.generateMockIntradayCandles(stock.symbol, true);
        } else {
          intradayCandles = await client.getIntraday1MinuteCandles(stock.symbol);
        }
      } catch (e) {
        intradayCandles = client.generateMockIntradayCandles(stock.symbol, simulateBreakout);
      }

      // Extract volume:
      // '1min'  -> 1st-minute opening candle (09:15)
      // '5min'  -> 5-minute opening candle (09:15–09:20)
      // '15min' -> 15-minute cumulative duration (09:15-09:30)
      // 'daily'/'weekly'/'monthly' -> full session
      let morningData: { volume: number; timestamp?: string };
      let windowDesc = '';
      if (tf === '1min') {
        morningData = get1MinOpeningCandle(intradayCandles);
        windowDesc = '1st-minute candle (09:15:00)';
      } else if (tf === '5min') {
        morningData = get5MinOpeningCandle(intradayCandles);
        windowDesc = '5-minute opening candle (09:15–09:20)';
      } else if (tf === '15min') {
        morningData = get15MinCumulativeVolume(intradayCandles);
        windowDesc = 'first 15-minute duration (09:15–09:30)';
      } else {
        morningData = { volume: calculateWholeDayMetrics(intradayCandles).totalVolume };
        windowDesc = 'today\'s trading session';
      }

      const evalResult = evaluateMorningBreakout(
        morningData.volume,
        stock.baseline200Volume,
        settings.morningMultiplier
      );

      const tfTag =
        tf === '1min'
          ? '1-MIN'
          : tf === '5min'
          ? '5-MIN'
          : tf === '15min'
          ? '15-MIN'
          : tf === 'daily'
          ? 'DAILY'
          : tf === 'weekly'
          ? 'WEEKLY'
          : 'MONTHLY';

      if (evalResult.isBreakout) {
        const isExtreme = evalResult.isExtremeBreakout;
        const notifTitle = isExtreme
          ? `🚨 ${stock.symbol} [${tfTag}]: 10x Volume Breakout (${evalResult.ratio}x)!`
          : `⚡ ${stock.symbol} [${tfTag}]: Volume Above 200 SMA (${evalResult.ratio}x)!`;

        await notifStore.addNotification({
          symbol: stock.symbol,
          companyName: stock.companyName,
          type: 'MORNING_BREAKOUT',
          timeframe: tf,
          title: notifTitle,
          message: `${stock.symbol} traded ${morningData.volume.toLocaleString('en-IN')} shares in ${windowDesc} — ${evalResult.ratio}x the 200-period baseline avg (${stock.baseline200Volume.toLocaleString('en-IN')}).`,
          ratio: evalResult.ratio,
          currentValue: morningData.volume,
          baselineValue: stock.baseline200Volume,
          metricType: 'volume',
        });

        // Increment unread count for this timeframe if it's NOT the active tab
        if (tf !== activeTimeframe) {
          set(state => ({
            unreadByTimeframe: {
              ...state.unreadByTimeframe,
              [tf]: state.unreadByTimeframe[tf] + 1,
            },
          }));
        }
      }

      set(state => ({
        watchlists: updateItemInTimeframe(state.watchlists, tf, stock.symbol, item => ({
          ...item,
          morningVolume: morningData.volume,
          morningRatio: evalResult.ratio,
          morningBreakout: evalResult.isBreakout,
          isExtremeBreakout: evalResult.isExtremeBreakout,
          isSmaBreakout: evalResult.isSmaBreakout,
          status: evalResult.isExtremeBreakout
            ? 'morning_triggered'
            : evalResult.isSmaBreakout
            ? 'morning_triggered'
            : item.status,
        })),
      }));
    }
  },

  runEveningSurveillance: async (tf: Timeframe, simulateBreakout = false) => {
    // The 1-min tab only supports the single morning volume condition
    // (09:15 candle volume >= multiplier * 200-period 1-min baseline)
    if (tf === '1min') return;

    const client = getYahooClient();
    const settings = useSettingsStore.getState();
    const notifStore = useNotificationStore.getState();
    const ist = getNowIST();
    const { activeTimeframe } = get();

    for (const stock of get().watchlists[tf]) {
      let intradayCandles: CandleData[] = [];
      try {
        intradayCandles = await client.getIntraday1MinuteCandles(stock.symbol);
      } catch (e) {
        intradayCandles = client.generateMockIntradayCandles(stock.symbol);
      }

      const metrics = calculateWholeDayMetrics(intradayCandles);
      let dayVol = simulateBreakout
        ? Math.round(stock.baseline200Volume * 1.8)
        : metrics.totalVolume;
      let dayHigh = simulateBreakout
        ? Math.round(stock.baseline200PriceHigh * 1.15)
        : metrics.high;

      const evalResult = evaluateEveningCondition(
        dayVol,
        dayHigh,
        stock.baseline200Volume,
        stock.baseline200PriceHigh,
        settings.eveningComparisonMode,
        tf === 'smacross' ? 1.0 : settings.eveningMultiplier
      );

      await saveEodRecord(stock.instrumentKey, ist.dateStr, dayVol, dayHigh, metrics.lastPrice);

      const tfTag =
        tf === '5min'
          ? '5-MIN'
          : tf === '15min'
          ? '15-MIN'
          : tf === 'daily'
          ? 'DAILY'
          : tf === 'smacross'
          ? 'DAILY-1X'
          : tf === 'weekly'
          ? 'WEEKLY'
          : 'MONTHLY';

      if (evalResult.isBreakout) {
        const metricLabel = evalResult.metricType === 'volume' ? 'Volume' : 'High Price';
        const fmtCurr =
          evalResult.metricType === 'volume'
            ? `${evalResult.currentValue.toLocaleString('en-IN')} shares`
            : `₹${evalResult.currentValue.toLocaleString('en-IN')}`;
        const fmtBase =
          evalResult.metricType === 'volume'
            ? `${evalResult.baselineValue.toLocaleString('en-IN')} shares`
            : `₹${evalResult.baselineValue.toLocaleString('en-IN')}`;

        await notifStore.addNotification({
          symbol: stock.symbol,
          companyName: stock.companyName,
          type: 'EVENING_EOD_MAX',
          timeframe: tf,
          title: `📊 ${stock.symbol} [${tfTag}]: 3:30 PM EOD ${metricLabel} Surpassed!`,
          message: `${stock.symbol} whole-day max reached ${fmtCurr} (${evalResult.ratio}x vs 200-period baseline of ${fmtBase}).`,
          ratio: evalResult.ratio,
          currentValue: evalResult.currentValue,
          baselineValue: evalResult.baselineValue,
          metricType: evalResult.metricType,
        });
      }

      set(state => ({
        watchlists: updateItemInTimeframe(state.watchlists, tf, stock.symbol, item => ({
          ...item,
          wholeDayVolume: dayVol,
          wholeDayHigh: dayHigh,
          eodRatio: evalResult.ratio,
          eodBreakout: evalResult.isBreakout,
          status: evalResult.isBreakout ? 'eod_triggered' : item.status,
        })),
      }));
    }
  },
}));
