import { create } from 'zustand';
import { NotificationItem, Timeframe } from '@/types';
import { getNowIST } from '@/services/engine/marketTime';
import {
  saveNotificationToDb,
  getAllNotificationsFromDb,
  deleteNotificationFromDb,
  clearAllNotificationsFromDb,
  purgePriorDayNotificationsFromDb,
} from '@/services/storage/indexedDb';
import { soundService } from '@/services/notifications/sound';
import { showPushNotification } from '@/services/notifications/browserPush';
import { useSettingsStore } from './useSettingsStore';

interface NotificationState {
  notifications: NotificationItem[];
  isDrawerOpen: boolean;
  isLoading: boolean;

  initNotifications: () => Promise<void>;
  addNotification: (
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'date' | 'isRead'>
  ) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  purgePriorDayNotifications: () => Promise<number>;
  markAllAsRead: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isDrawerOpen: false,
  isLoading: true,

  initNotifications: async () => {
    try {
      const ist = getNowIST();
      await purgePriorDayNotificationsFromDb(ist.dateStr);
      const items = await getAllNotificationsFromDb();
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ notifications: items, isLoading: false });
    } catch (e) {
      console.warn('[NotificationStore] Init failed:', e);
      set({ isLoading: false });
    }
  },

  addNotification: async item => {
    const ist = getNowIST();
    const newNotif: NotificationItem = {
      ...item,
      id: `${item.symbol}_${item.type}_${item.timeframe}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: ist.dateStr,
      isRead: false,
    };

    const { soundEnabled, browserNotificationsEnabled } = useSettingsStore.getState();

    // ─── 1x chime if app is focused, 3x if app/tab is hidden ───
    if (soundEnabled) {
      const isHidden =
        typeof document !== 'undefined' && document.visibilityState === 'hidden';
      const chimeCount: 1 | 3 = isHidden ? 3 : 1;

      if (item.type === 'MORNING_BREAKOUT') {
        soundService.playBreakoutChimes(chimeCount);
      } else {
        soundService.playEodChimes(chimeCount);
      }
    }

    if (browserNotificationsEnabled) {
      showPushNotification(item.title, item.message, newNotif.id);
    }

    await saveNotificationToDb(newNotif);

    set(state => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  dismissNotification: async (id: string) => {
    await deleteNotificationFromDb(id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearAllNotifications: async () => {
    await clearAllNotificationsFromDb();
    set({ notifications: [] });
  },

  purgePriorDayNotifications: async () => {
    const ist = getNowIST();
    const count = await purgePriorDayNotificationsFromDb(ist.dateStr);
    if (count > 0) {
      set(state => ({
        notifications: state.notifications.filter(n => n.date === ist.dateStr),
      }));
    }
    return count;
  },

  markAllAsRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    })),

  toggleDrawer: () => set(state => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),
}));
