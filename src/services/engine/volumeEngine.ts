import { CandleData, Timeframe } from '@/types';

export interface BaselineStats {
  avgVolume: number;
  avgHigh: number;
  candleCount: number;
}

export interface MorningEvaluationResult {
  isBreakout: boolean;          // true if cdn1 || cdn2 (ratio >= 1.0)
  isExtremeBreakout: boolean;   // cdn1: ratio >= multiplier (default 10x)
  isSmaBreakout: boolean;       // cdn2: ratio >= 1.0 (above 200 SMA)
  volume: number;
  baseline: number;
  ratio: number;
  candleTimestamp?: string;
}

export interface EveningEvaluationResult {
  isBreakout: boolean;
  currentValue: number;
  baselineValue: number;
  ratio: number;
  metricType: 'volume' | 'price';
}

/**
 * Calculates average volume and average high price across historical candles (Volume 200 SMA).
 * Matches TradingView / Groww / Upstox Volume 200 SMA on any timeframe.
 */
export function calculateBaselineAverages(candles: CandleData[]): BaselineStats {
  if (!candles || candles.length === 0) {
    return { avgVolume: 0, avgHigh: 0, candleCount: 0 };
  }

  // Ensure chronological order (oldest -> newest), then take the most recent 200 candles
  const isAscending =
    candles.length >= 2
      ? new Date(candles[0][0]).getTime() < new Date(candles[candles.length - 1][0]).getTime()
      : true;
  const sorted = isAscending ? candles : [...candles].reverse();
  const sample = sorted.slice(-200);

  let totalVolume = 0;
  let totalHigh = 0;

  for (const c of sample) {
    totalVolume += c[5]; // Volume is index 5
    totalHigh += c[2];   // High is index 2
  }

  const avgVolume = Math.round(totalVolume / sample.length);
  const avgHigh = Math.round((totalHigh / sample.length) * 100) / 100;

  return {
    avgVolume,
    avgHigh,
    candleCount: sample.length,
  };
}

/**
 * Finds the single 1st-minute opening candle (09:15:00 - 09:15:59 IST).
 */
export function get1MinOpeningCandle(
  candles: CandleData[]
): { volume: number; timestamp?: string } {
  if (!candles || candles.length === 0) return { volume: 0 };
  const matched = candles.find(c => c[0].includes('09:15:'));
  if (matched) return { volume: matched[5], timestamp: matched[0] };
  return { volume: candles[0][5], timestamp: candles[0][0] };
}

/**
 * Finds the 5-minute opening volume (09:15:00 to 09:19:59 IST).
 */
export function get5MinOpeningCandle(
  candles: CandleData[]
): { volume: number; timestamp?: string } {
  if (!candles || candles.length === 0) return { volume: 0 };

  const windowCandles = candles.filter(c => {
    const timeMatch = c[0].match(/(\d{2}):(\d{2}):/);
    if (!timeMatch) return false;
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    return hour === 9 && minute >= 15 && minute < 20;
  });

  if (windowCandles.length > 0) {
    const total = windowCandles.reduce((sum, c) => sum + c[5], 0);
    return { volume: total, timestamp: windowCandles[0][0] };
  }

  const first5 = candles.slice(0, 5);
  const total = first5.reduce((sum, c) => sum + c[5], 0);
  return { volume: total, timestamp: candles[0]?.[0] };
}

/**
 * Computes the total cumulative traded volume across the 15-minute opening duration (09:15:00 to 09:30:00 IST).
 * Sums all 1-minute candles from 09:15:00 to 09:29:59.
 */
export function get15MinCumulativeVolume(
  candles: CandleData[]
): { volume: number; timestamp?: string } {
  if (!candles || candles.length === 0) return { volume: 0 };

  const windowCandles = candles.filter(c => {
    const timeMatch = c[0].match(/(\d{2}):(\d{2}):/);
    if (!timeMatch) return false;
    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    return hour === 9 && minute >= 15 && minute < 30;
  });

  if (windowCandles.length > 0) {
    const total = windowCandles.reduce((sum, c) => sum + c[5], 0);
    return { volume: total, timestamp: windowCandles[0][0] };
  }

  const first15 = candles.slice(0, 15);
  const total = first15.reduce((sum, c) => sum + c[5], 0);
  return { volume: total, timestamp: candles[0]?.[0] };
}

/**
 * Finds the morning candle (9:15 AM or 9:29 AM) from intraday 1-minute candle array.
 * Upstox candles format: [timestamp, open, high, low, close, volume, oi]
 */
export function findMorningCandle(
  candles: CandleData[],
  targetTime: '9:16' | '9:30'
): { volume: number; timestamp?: string } {
  if (!candles || candles.length === 0) {
    return { volume: 0 };
  }

  // targetTime '9:16' corresponds to candle opened at 09:15:00
  // targetTime '9:30' corresponds to 15th minute candle opened at 09:29:00
  const searchPattern = targetTime === '9:16' ? '09:15:' : '09:29:';

  const matched = candles.find(c => c[0].includes(searchPattern));
  if (matched) {
    return {
      volume: matched[5],
      timestamp: matched[0],
    };
  }

  // Fallback: If candles are sorted descending (newest first), market open is at the end of the array
  // If sorted ascending (oldest first), 9:15 is index 0 and 9:29 is index 14
  const isAscending = new Date(candles[0][0]).getTime() < new Date(candles[candles.length - 1][0]).getTime();
  const sorted = isAscending ? candles : [...candles].reverse();

  const index = targetTime === '9:16' ? 0 : 14;
  if (sorted.length > index) {
    return {
      volume: sorted[index][5],
      timestamp: sorted[index][0],
    };
  }

  return { volume: 0 };
}

/**
 * Computes whole-day metrics from 1-minute intraday candles:
 * Total cumulative volume, day's high, day's low, and latest price.
 */
export function calculateWholeDayMetrics(candles: CandleData[]): {
  totalVolume: number;
  high: number;
  low: number;
  lastPrice: number;
} {
  if (!candles || candles.length === 0) {
    return { totalVolume: 0, high: 0, low: 0, lastPrice: 0 };
  }

  let totalVolume = 0;
  let high = -Infinity;
  let low = Infinity;

  for (const c of candles) {
    totalVolume += c[5]; // volume
    if (c[2] > high) high = c[2]; // high
    if (c[3] < low) low = c[3];   // low
  }

  // Most recent close (depends on sort order)
  const isAscending = new Date(candles[0][0]).getTime() < new Date(candles[candles.length - 1][0]).getTime();
  const lastPrice = isAscending ? candles[candles.length - 1][4] : candles[0][4];

  return {
    totalVolume,
    high: high === -Infinity ? 0 : high,
    low: low === Infinity ? 0 : low,
    lastPrice,
  };
}

/**
 * Evaluates the Morning Breakout condition:
 * Morning Volume >= multiplier * 200-period baseline volume
 */
export function evaluateMorningBreakout(
  morningVolume: number,
  baselineVolume: number,
  multiplier = 10
): MorningEvaluationResult {
  if (baselineVolume <= 0 || morningVolume <= 0) {
    return {
      isBreakout: false,
      isExtremeBreakout: false,
      isSmaBreakout: false,
      volume: morningVolume,
      baseline: baselineVolume,
      ratio: 0,
    };
  }

  const ratio = Math.round((morningVolume / baselineVolume) * 100) / 100;
  // Condition 1: ratio >= 10x (Extreme Volume Breakout)
  const isExtremeBreakout = ratio >= multiplier;
  // Condition 2: ratio >= 1.0x (Volume crossed 200 SMA baseline)
  const isSmaBreakout = ratio >= 1.0;
  // Breakout triggers if either condition 1 OR condition 2 is met:
  const isBreakout = isExtremeBreakout || isSmaBreakout;

  return {
    isBreakout,
    isExtremeBreakout,
    isSmaBreakout,
    volume: morningVolume,
    baseline: baselineVolume,
    ratio,
  };
}

/**
 * Evaluates the Evening 3:30 PM EOD condition:
 * Today's whole day maximum (volume or price high) > multiplier * 200-period baseline
 */
export function evaluateEveningCondition(
  wholeDayVolume: number,
  wholeDayHigh: number,
  baselineVolume: number,
  baselineHigh: number,
  mode: 'volume' | 'price' = 'volume',
  multiplier = 1.0
): EveningEvaluationResult {
  const currentValue = mode === 'volume' ? wholeDayVolume : wholeDayHigh;
  const baselineValue = mode === 'volume' ? baselineVolume : baselineHigh;

  if (baselineValue <= 0 || currentValue <= 0) {
    return {
      isBreakout: false,
      currentValue,
      baselineValue,
      ratio: 0,
      metricType: mode,
    };
  }

  const ratio = Math.round((currentValue / baselineValue) * 100) / 100;
  const isBreakout = currentValue >= multiplier * baselineValue;

  return {
    isBreakout,
    currentValue,
    baselineValue,
    ratio,
    metricType: mode,
  };
}

