/**
 * Indian Standard Time (IST, UTC+05:30) utilities for market surveillance.
 */

export interface ISTTimeInfo {
  dateStr: string; // 'YYYY-MM-DD'
  timeStr: string; // 'HH:MM:SS'
  hours: number;
  minutes: number;
  seconds: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isWeekday: boolean;
}

export function getNowIST(): ISTTimeInfo {
  const now = new Date();
  
  // Format into Asia/Kolkata parts
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const hours = parseInt(partMap.hour || '0', 10);
  const minutes = parseInt(partMap.minute || '0', 10);
  const seconds = parseInt(partMap.second || '0', 10);
  
  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${partMap.hour}:${partMap.minute}:${partMap.second}`;

  // Day of week in IST
  const weekdayStr = partMap.weekday; // 'Mon', 'Tue', ...
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayOfWeekMap[weekdayStr] ?? now.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  return {
    dateStr,
    timeStr,
    hours,
    minutes,
    seconds,
    dayOfWeek,
    isWeekday,
  };
}

export function isMarketOpen(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return false;
  const totalMinutes = ist.hours * 60 + ist.minutes;
  // 9:15 AM = 555 mins, 3:30 PM (15:30) = 930 mins
  return totalMinutes >= 555 && totalMinutes < 930;
}

export function isPreMarket(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return false;
  const totalMinutes = ist.hours * 60 + ist.minutes;
  // 9:00 AM = 540 mins, 9:15 AM = 555 mins
  return totalMinutes >= 540 && totalMinutes < 555;
}

export function isPostMarket(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return true;
  const totalMinutes = ist.hours * 60 + ist.minutes;
  return totalMinutes >= 930;
}

export function isPast916(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return false;
  return ist.hours * 60 + ist.minutes >= 556; // 9:16 AM
}

export function isPast920(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return false;
  return ist.hours * 60 + ist.minutes >= 560; // 9:20 AM
}

export function isPast930(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return false;
  return ist.hours * 60 + ist.minutes >= 570; // 9:30 AM
}

export function isPastMorningOpening(ist: ISTTimeInfo = getNowIST(), mode: '9:16' | '9:30' | 'both'): boolean {
  if (!ist.isWeekday) return false;
  const totalMinutes = ist.hours * 60 + ist.minutes;
  if (mode === '9:16') {
    return totalMinutes >= 556; // 9:16 AM
  } else if (mode === '9:30') {
    return totalMinutes >= 570; // 9:30 AM
  } else {
    // Both: triggers at 9:16 AM
    return totalMinutes >= 556;
  }
}

export function isPastMarketClose(ist: ISTTimeInfo = getNowIST()): boolean {
  if (!ist.isWeekday) return true;
  const totalMinutes = ist.hours * 60 + ist.minutes;
  return totalMinutes >= 930; // 15:30 PM
}

export function isFirstTradingDayOfWeek(ist: ISTTimeInfo = getNowIST()): boolean {
  // Monday is dayOfWeek 1
  return ist.dayOfWeek === 1;
}

export function isLastTradingDayOfWeek(ist: ISTTimeInfo = getNowIST()): boolean {
  // Friday is dayOfWeek 5
  return ist.dayOfWeek === 5;
}

export function isFirstTradingDayOfMonth(ist: ISTTimeInfo = getNowIST()): boolean {
  const day = parseInt(ist.dateStr.split('-')[2], 10);
  // 1st of month (or 2nd/3rd if 1st fell on weekend)
  return day <= 3 && ist.isWeekday;
}

export function isLastTradingDayOfMonth(ist: ISTTimeInfo = getNowIST()): boolean {
  const parts = ist.dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Last day of this month
  const lastDate = new Date(year, month, 0).getDate();
  return day >= lastDate - 2 && ist.isWeekday;
}

