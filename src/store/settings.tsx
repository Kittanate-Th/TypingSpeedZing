import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Settings } from "../types";

export const SETTINGS_STORAGE_KEY = "tz_settings";

export const DEFAULT_SETTINGS: Settings = {
  lang: "en",
  direction: "aurora",
  dark: true,
  accent: "amber",
  glow: 70,
  font: "geist",
  showKeyboard: true,
  heatmap: true,
};

interface SettingsContextValue {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadSettings(): Settings {
  if (!canUseStorage()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage is best-effort; defaults still keep the app usable.
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((next: Settings) => {
    setSettingsState({ ...DEFAULT_SETTINGS, ...next });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((current) => ({ ...current, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, updateSettings, resetSettings }),
    [resetSettings, setSettings, settings, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used within SettingsProvider");
  return value;
}
