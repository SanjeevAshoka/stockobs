import { CandleData, Timeframe, Instrument } from '@/types';

const BASE_URL = '/api/yahoo/v8/finance/chart';

/**
 * Converts an NSE stock symbol to Yahoo Finance format.
 * e.g. 'RELIANCE' → 'RELIANCE.NS'
 */
export function toYahooSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.includes('.')) return s; // already has suffix
  return `${s}.NS`;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}

function parseCandleResponse(json: YahooChartResponse): CandleData[] {
  const result = json?.chart?.result?.[0];
  if (!result) return [];

  const timestamps = result.timestamp ?? [];
  const q = result.indicators.quote[0];
  if (!q) return [];

  const candles: CandleData[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = q.open[i];
    const high = q.high[i];
    const low = q.low[i];
    const close = q.close[i];
    const volume = q.volume[i];

    // Skip null candles (pre/post market gaps)
    if (close === null || close === undefined) continue;

    // Convert Unix epoch seconds → ISO string with IST offset
    const ts = new Date(timestamps[i] * 1000).toISOString();
    candles.push([
      ts,
      open ?? 0,
      high ?? 0,
      low ?? 0,
      close ?? 0,
      volume ?? 0,
      0, // open interest not provided by Yahoo
    ]);
  }
  return candles;
}

export class YahooFinanceClient {
  constructor(private isDemoMode: () => boolean) {}

  /**
   * Fetches intraday 1-minute candles for the current trading session.
   * Yahoo Finance retains 1m data for the last 7 days.
   */
  async getIntraday1MinuteCandles(symbol: string): Promise<CandleData[]> {
    if (this.isDemoMode()) {
      return this.generateMockIntradayCandles(symbol);
    }

    const yahooSymbol = toYahooSymbol(symbol);
    const url = `${BASE_URL}/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance HTTP ${response.status} for ${yahooSymbol}`);
    }

    const json: YahooChartResponse = await response.json();

    if (json.chart.error) {
      throw new Error(`Yahoo Finance API error: ${json.chart.error.description}`);
    }

    return parseCandleResponse(json);
  }

  /**
   * Fetches historical OHLCV candles.
   * daily   → interval=1d,  range=2y    (≈ 500+ trading days, we slice to 200)
   * weekly  → interval=1wk, range=200wk (≈ 200 weeks ≈ 4 years)
   * monthly → interval=1mo, range=200mo (≈ 17+ years)
   */
  async getHistoricalCandles(symbol: string, timeframe: Timeframe): Promise<CandleData[]> {
    if (this.isDemoMode()) {
      return this.generateMockHistoricalCandles(symbol, timeframe);
    }

    const yahooSymbol = toYahooSymbol(symbol);

    let interval: string;
    let range: string;

    if (timeframe === '1min') {
      interval = '1m';
      range = '5d';
    } else if (timeframe === '5min') {
      interval = '5m';
      range = '1mo';
    } else if (timeframe === '15min') {
      interval = '15m';
      range = '60d';
    } else if (timeframe === 'daily') {
      interval = '1d';
      range = '2y';
    } else if (timeframe === 'weekly') {
      interval = '1wk';
      range = '200wk';
    } else {
      interval = '1mo';
      range = '200mo';
    }

    const url = `${BASE_URL}/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance HTTP ${response.status} for ${yahooSymbol} [${timeframe}]`);
    }

    const json: YahooChartResponse = await response.json();

    if (json.chart.error) {
      throw new Error(`Yahoo Finance API error: ${json.chart.error.description}`);
    }

    return parseCandleResponse(json);
  }

  /**
   * Performs live network search on Yahoo Finance for matching NSE / Indian stocks.
   */
  async searchSymbols(query: string): Promise<Instrument[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const url = `/api/yahoo/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return [];

      const json = await response.json();
      const quotes = json?.quotes || [];

      // Filter for Indian instruments (NSE preferred, BSE accepted)
      const indianQuotes = quotes.filter((item: any) => {
        if (!item.symbol) return false;
        const sym = item.symbol.toUpperCase();
        const exch = (item.exchDisp || item.exchange || '').toUpperCase();
        return (
          sym.endsWith('.NS') ||
          sym.endsWith('.BO') ||
          exch === 'NSE' ||
          exch === 'NSI' ||
          exch === 'BSE'
        );
      });

      // Sort so .NS (NSE) takes precedence over .BO (BSE)
      indianQuotes.sort((a: any, b: any) => {
        const aNs = (a.symbol || '').toUpperCase().endsWith('.NS');
        const bNs = (b.symbol || '').toUpperCase().endsWith('.NS');
        if (aNs && !bNs) return -1;
        if (!aNs && bNs) return 1;
        return 0;
      });

      const seen = new Set<string>();
      const results: Instrument[] = [];

      for (const item of indianQuotes) {
        const rawSymbol = item.symbol.toUpperCase();
        const cleanSymbol = rawSymbol.replace(/\.(NS|BO)$/, '');
        if (!cleanSymbol || seen.has(cleanSymbol)) continue;
        seen.add(cleanSymbol);

        const exchange = rawSymbol.endsWith('.BO') ? 'BSE' : 'NSE';
        results.push({
          symbol: cleanSymbol,
          instrumentKey: `${exchange}_EQ|${cleanSymbol}`,
          name: item.shortname || item.longname || `${cleanSymbol} (${exchange})`,
          segment: `${exchange}_EQ`,
          exchange,
        });
      }

      return results;
    } catch (e) {
      console.warn('[YahooFinanceClient] Live search error:', e);
      return [];
    }
  }

  // ─── Realistic Mock Generators for Demo / Weekend / Offline Testing ───

  generateMockIntradayCandles(symbol: string, simulateBreakout = false): CandleData[] {
    const seed = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const basePrice = 2500 + (Math.abs(seed) % 1500);
    const today = new Date().toISOString().split('T')[0];

    const candles: CandleData[] = [];
    let currentClose = basePrice;

    for (let minute = 0; minute < 375; minute++) {
      const hour = 9 + Math.floor((15 + minute) / 60);
      const min = (15 + minute) % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00+05:30`;
      const ts = `${today}T${timeStr}`;

      const open = currentClose;
      const change = (Math.random() - 0.49) * 4;
      const close = Math.round((open + change) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.random() * 2) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.random() * 2) * 100) / 100;
      currentClose = close;

      let volume = Math.floor(2000 + Math.random() * 8000);
      if (minute === 0 && simulateBreakout) volume = 1800000;
      if (minute === 14 && simulateBreakout) volume = 1200000;

      candles.push([ts, open, high, low, close, volume, 0]);
    }

    return candles; // ascending order (oldest first)
  }

  generateMockHistoricalCandles(symbol: string, timeframe: Timeframe): CandleData[] {
    const seed = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const basePrice = 2500 + (Math.abs(seed) % 1500);
    const avgDailyVol = 120000 + (Math.abs(seed) % 80000);

    const candles: CandleData[] = [];
    let price = basePrice;
    const count = 200;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      if (timeframe === '1min') {
        d.setMinutes(d.getMinutes() - (i + 1));
      } else if (timeframe === '5min') {
        d.setMinutes(d.getMinutes() - (i + 1) * 5);
      } else if (timeframe === '15min') {
        d.setMinutes(d.getMinutes() - (i + 1) * 15);
      } else if (timeframe === 'daily') {
        d.setDate(d.getDate() - (i + 1));
      } else if (timeframe === 'weekly') {
        d.setDate(d.getDate() - (i + 1) * 7);
      } else {
        d.setMonth(d.getMonth() - (i + 1));
      }

      const open = price;
      const change = (Math.random() - 0.48) * 20;
      const close = Math.round((open + change) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.random() * 15) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.random() * 15) * 100) / 100;
      price = close;

      let multiplier = 1;
      if (timeframe === '1min') multiplier = 1 / 375;
      else if (timeframe === '5min') multiplier = 1 / 75;
      else if (timeframe === '15min') multiplier = 1 / 25;
      else if (timeframe === 'weekly') multiplier = 5;
      else if (timeframe === 'monthly') multiplier = 22;

      const volume = Math.max(10, Math.floor((avgDailyVol + (Math.random() - 0.5) * 40000) * multiplier));

      candles.push([d.toISOString(), open, high, low, close, volume, 0]);
    }

    return candles; // ascending order
  }
}

