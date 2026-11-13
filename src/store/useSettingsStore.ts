import { create } from 'zustand';
import { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  setMorningTriggerTime: (time: '9:16' | '9:30' | 'both') => void;
  setMorningMultiplier: (mult: number) => void;
  setEveningMultiplier: (mult: number) => void;
  setEveningComparisonMode: (mode: 'volume' | 'price') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;
  setDemoMode: (enabled: boolean) => void;
  resetDefaults: () => void;
}

const STORAGE_KEY = 'stockobs_settings';

const defaultSettings: AppSettings = {
  morningTriggerTime: 'both',
  morningMultiplier: 10,
  eveningMultiplier: 1.0,
  eveningComparisonMode: 'volume',
  soundEnabled: true,
  browserNotificationsEnabled: true,
  demoMode: false,
};

function loadStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[SettingsStore] Failed to load:', e);
  }
  return defaultSettings;
}

function persistSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('[SettingsStore] Failed to persist:', e);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadStoredSettings();

  const update = (partial: Partial<AppSettings>) => {
    const current: AppSettings = {
      morningTriggerTime: get().morningTriggerTime,
      morningMultiplier: get().morningMultiplier,
      eveningMultiplier: get().eveningMultiplier,
      eveningComparisonMode: get().eveningComparisonMode,
      soundEnabled: get().soundEnabled,
      browserNotificationsEnabled: get().browserNotificationsEnabled,
      demoMode: get().demoMode,
    };
    const next = { ...current, ...partial };
    persistSettings(next);
    set(partial);
  };

  return {
    ...initial,
    setMorningTriggerTime: time => update({ morningTriggerTime: time }),
    setMorningMultiplier: mult => update({ morningMultiplier: mult }),
    setEveningMultiplier: mult => update({ eveningMultiplier: mult }),
    setEveningComparisonMode: mode => update({ eveningComparisonMode: mode }),
    setSoundEnabled: enabled => update({ soundEnabled: enabled }),
    setBrowserNotificationsEnabled: enabled => update({ browserNotificationsEnabled: enabled }),
    setDemoMode: enabled => update({ demoMode: enabled }),
    resetDefaults: () => { persistSettings(defaultSettings); set(defaultSettings); },
  };
});
