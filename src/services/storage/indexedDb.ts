import { openDB, IDBPDatabase } from 'idb';
import { CandleData, NotificationItem, Timeframe } from '@/types';

const DB_NAME = 'stockobs_db';
const DB_VERSION = 1;

interface CachedCandlesRecord {
  key: string; // `${instrumentKey}_${timeframe}`
  instrumentKey: string;
  timeframe: Timeframe;
  candles: CandleData[];
  avgVolume: number;
  avgHigh: number;
  updatedAt: string;
}

interface EodRecord {
  key: string; // `${instrumentKey}_${date}`
  instrumentKey: string;
  date: string;
  volume: number;
  high: number;
  close: number;
  timestamp: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('candles')) {
          db.createObjectStore('candles', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('eod_records')) {
          db.createObjectStore('eod_records', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('by_date', 'date');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveCandleHistory(
  instrumentKey: string,
  timeframe: Timeframe,
  candles: CandleData[],
  avgVolume: number,
  avgHigh: number
): Promise<void> {
  const db = await getDb();
  const record: CachedCandlesRecord = {
    key: `${instrumentKey}_${timeframe}`,
    instrumentKey,
    timeframe,
    candles,
    avgVolume,
    avgHigh,
    updatedAt: new Date().toISOString(),
  };
  await db.put('candles', record);
}

export async function getCandleHistory(
  instrumentKey: string,
  timeframe: Timeframe
): Promise<CachedCandlesRecord | undefined> {
  const db = await getDb();
  return db.get('candles', `${instrumentKey}_${timeframe}`);
}

export async function saveEodRecord(
  instrumentKey: string,
  date: string,
  volume: number,
  high: number,
  close: number
): Promise<void> {
  const db = await getDb();
  const record: EodRecord = {
    key: `${instrumentKey}_${date}`,
    instrumentKey,
    date,
    volume,
    high,
    close,
    timestamp: new Date().toISOString(),
  };
  await db.put('eod_records', record);
}

export async function getEodRecord(
  instrumentKey: string,
  date: string
): Promise<EodRecord | undefined> {
  const db = await getDb();
  return db.get('eod_records', `${instrumentKey}_${date}`);
}

export async function saveNotificationToDb(notification: NotificationItem): Promise<void> {
  const db = await getDb();
  await db.put('notifications', notification);
}

export async function getAllNotificationsFromDb(): Promise<NotificationItem[]> {
  const db = await getDb();
  return db.getAll('notifications');
}

export async function deleteNotificationFromDb(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('notifications', id);
}

export async function clearAllNotificationsFromDb(): Promise<void> {
  const db = await getDb();
  await db.clear('notifications');
}

export async function purgePriorDayNotificationsFromDb(currentDateIST: string): Promise<number> {
  const db = await getDb();
  const allNotifs = await db.getAll('notifications');
  let purgedCount = 0;
  for (const notif of allNotifs) {
    if (notif.date !== currentDateIST) {
      await db.delete('notifications', notif.id);
      purgedCount++;
    }
  }
  return purgedCount;
}

