import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RunResult } from "../types";

export const HISTORY_STORAGE_KEY = "tz_history";
export const HISTORY_LIMIT = 50;

interface HistoryContextValue {
  history: RunResult[];
  addResult: (result: RunResult) => void;
  clearHistory: () => void;
  best: RunResult | null;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function capHistory(history: RunResult[]): RunResult[] {
  return history.slice(0, HISTORY_LIMIT);
}

function loadHistory(): RunResult[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? capHistory(parsed as RunResult[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: RunResult[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capHistory(history)));
  } catch {
    // Storage failures should never block a completed run.
  }
}

export function selectBest(history: RunResult[]): RunResult | null {
  return history.reduce<RunResult | null>((best, result) => {
    if (!best) return result;
    if (result.wpm !== best.wpm) return result.wpm > best.wpm ? result : best;
    if (result.acc !== best.acc) return result.acc > best.acc ? result : best;
    return result.at > best.at ? result : best;
  }, null);
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RunResult[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addResult = useCallback((result: RunResult) => {
    setHistory((current) => capHistory([result, ...current]));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const best = useMemo(() => selectBest(history), [history]);
  const value = useMemo(() => ({ history, addResult, clearHistory, best }), [addResult, best, clearHistory, history]);

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const value = useContext(HistoryContext);
  if (!value) throw new Error("useHistory must be used within HistoryProvider");
  return value;
}
