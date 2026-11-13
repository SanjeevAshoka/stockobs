import {
  getNowIST,
  isPast916,
  isPast920,
  isPast930,
  isPastMarketClose,
  isFirstTradingDayOfWeek,
  isLastTradingDayOfWeek,
  isFirstTradingDayOfMonth,
  isLastTradingDayOfMonth,
} from './marketTime';
import { useStockStore } from '@/store/useStockStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Timeframe } from '@/types';

type ScanRecord = Record<Timeframe, string | null>;

class MarketScheduler {
  private timerId: any = null;
  private lastMorningScanDate: ScanRecord = {
    '1min': null,
    '5min': null,
    '15min': null,
    daily: null,
    weekly: null,
    monthly: null,
  };
  private lastEveningScanDate: ScanRecord = {
    '1min': null,
    '5min': null,
    '15min': null,
    daily: null,
    weekly: null,
    monthly: null,
  };
  private lastPurgeDate: string | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Restore persisted scan dates
    this.lastMorningScanDate = {
      '1min': localStorage.getItem('stockobs_morning_1min'),
      '5min': localStorage.getItem('stockobs_morning_5min'),
      '15min': localStorage.getItem('stockobs_morning_15min'),
      daily: localStorage.getItem('stockobs_morning_daily'),
      weekly: localStorage.getItem('stockobs_morning_weekly'),
      monthly: localStorage.getItem('stockobs_morning_monthly'),
    };
    this.lastEveningScanDate = {
      '1min': localStorage.getItem('stockobs_evening_1min'),
      '5min': localStorage.getItem('stockobs_evening_5min'),
      '15min': localStorage.getItem('stockobs_evening_15min'),
      daily: localStorage.getItem('stockobs_evening_daily'),
      weekly: localStorage.getItem('stockobs_evening_weekly'),
      monthly: localStorage.getItem('stockobs_evening_monthly'),
    };
    this.lastPurgeDate = localStorage.getItem('stockobs_last_purge_date');

    // Immediate check on startup
    this.checkSchedule();

    // Check every 5 seconds
    this.timerId = setInterval(() => this.checkSchedule(), 5000);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  private async checkSchedule(): Promise<void> {
    const ist = getNowIST();
    const today = ist.dateStr;

    // ─── Auto-purge prior day notifications ───
    if (this.lastPurgeDate !== today) {
      try {
        await useNotificationStore.getState().purgePriorDayNotifications();
        this.lastPurgeDate = today;
        localStorage.setItem('stockobs_last_purge_date', today);
      } catch (e) {
        console.warn('[Scheduler] Auto-purge failed:', e);
      }
    }

    if (!ist.isWeekday) return;

    const store = useStockStore.getState();
    const isPastClose = isPastMarketClose(ist);

    // ─── 1-MIN Engine (09:16 AM IST: 1st minute 09:15:00 candle) ───
    if (isPast916(ist) && this.lastMorningScanDate['1min'] !== today) {
      this.lastMorningScanDate['1min'] = today;
      localStorage.setItem('stockobs_morning_1min', today);
      console.log('[Scheduler] 1-Min opening surveillance (09:15 candle)...');
      store.runMorningSurveillance('1min').catch(console.error);
    }

    // ─── 5-MIN Engine (09:20 AM IST: 5-minute 09:15-09:20 candle) ───
    if (isPast920(ist) && this.lastMorningScanDate['5min'] !== today) {
      this.lastMorningScanDate['5min'] = today;
      localStorage.setItem('stockobs_morning_5min', today);
      console.log('[Scheduler] 5-Min opening surveillance (09:15-09:20 candle)...');
      store.runMorningSurveillance('5min').catch(console.error);
    }

    // ─── 15-MIN Engine (09:30 AM IST: cumulative 09:15-09:30 duration) ───
    if (isPast930(ist) && this.lastMorningScanDate['15min'] !== today) {
      this.lastMorningScanDate['15min'] = today;
      localStorage.setItem('stockobs_morning_15min', today);
      console.log('[Scheduler] 15-Min duration surveillance (09:15-09:30 cumulative)...');
      store.runMorningSurveillance('15min').catch(console.error);
    }

    // ─── DAILY / EOD Engine (03:30 PM IST: whole-day volume vs 200-day daily SMA) ───
    if (isPastClose && this.lastEveningScanDate.daily !== today) {
      this.lastEveningScanDate.daily = today;
      localStorage.setItem('stockobs_evening_daily', today);
      console.log('[Scheduler] Daily EOD surveillance (3:30 PM EOD)...');
      store.runEveningSurveillance('daily').catch(console.error);
    }

    // ─── WEEKLY Engine (morning: Monday 9:30 AM, evening: Friday 3:30 PM) ───
    if (isPast930(ist) && isFirstTradingDayOfWeek(ist) && this.lastMorningScanDate.weekly !== today) {
      this.lastMorningScanDate.weekly = today;
      localStorage.setItem('stockobs_morning_weekly', today);
      console.log('[Scheduler] Weekly morning surveillance...');
      store.runMorningSurveillance('weekly').catch(console.error);
    }

    if (isPastClose && isLastTradingDayOfWeek(ist) && this.lastEveningScanDate.weekly !== today) {
      this.lastEveningScanDate.weekly = today;
      localStorage.setItem('stockobs_evening_weekly', today);
      console.log('[Scheduler] Weekly evening surveillance...');
      store.runEveningSurveillance('weekly').catch(console.error);
    }

    // ─── MONTHLY Engine (morning: 1st trading day 9:30 AM, evening: last trading day 3:30 PM) ───
    if (isPast930(ist) && isFirstTradingDayOfMonth(ist) && this.lastMorningScanDate.monthly !== today) {
      this.lastMorningScanDate.monthly = today;
      localStorage.setItem('stockobs_morning_monthly', today);
      console.log('[Scheduler] Monthly morning surveillance...');
      store.runMorningSurveillance('monthly').catch(console.error);
    }

    if (isPastClose && isLastTradingDayOfMonth(ist) && this.lastEveningScanDate.monthly !== today) {
      this.lastEveningScanDate.monthly = today;
      localStorage.setItem('stockobs_evening_monthly', today);
      console.log('[Scheduler] Monthly evening surveillance...');
      store.runEveningSurveillance('monthly').catch(console.error);
    }
  }
}

export const marketScheduler = new MarketScheduler();
