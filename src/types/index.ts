export type Timeframe = '1min' | '5min' | '15min' | 'daily' | 'smacross' | 'weekly' | 'monthly';

export type MarketStatus = 'OPEN' | 'PRE_MARKET' | 'CLOSED';

export type CandleData = [
  timestamp: string,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
  openInterest: number
];

export interface Instrument {
  symbol: string;
  instrumentKey: string;
  name: string;
  segment: string;
  exchange: string;
}

export interface StockWatchItem {
  symbol: string;
  instrumentKey: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;

  // Morning metrics (9:16 AM / 9:30 AM)
  morningCandleTimestamp?: string;
  morningVolume: number;
  morningRatio: number;
  morningBreakout: boolean;
  isExtremeBreakout?: boolean; // cdn1: >= 10x
  isSmaBreakout?: boolean;     // cdn2: >= 1x

  // Evening metrics (3:30 PM EOD)
  wholeDayVolume: number;
  wholeDayHigh: number;
  eodRatio: number;
  eodBreakout: boolean;

  // 200-period baseline averages (per-timeframe)
  baseline200Volume: number;
  baseline200PriceHigh: number;

  lastUpdated: string;
  status: 'idle' | 'awaiting_morning' | 'morning_triggered' | 'awaiting_eod' | 'eod_triggered' | 'error';
}

export interface NotificationItem {
  id: string;
  symbol: string;
  companyName: string;
  type: 'MORNING_BREAKOUT' | 'EVENING_EOD_MAX';
  timeframe: Timeframe; // which engine fired this alert
  title: string;
  message: string;
  ratio: number;
  currentValue: number;
  baselineValue: number;
  metricType: 'volume' | 'price';
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD IST
  isRead: boolean;
}

// No upstoxAccessToken — using Yahoo Finance (no auth needed)
export interface AppSettings {
  morningTriggerTime: '9:16' | '9:30' | 'both';
  morningMultiplier: number;
  eveningMultiplier: number;
  eveningComparisonMode: 'volume' | 'price';
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  demoMode: boolean;
}
