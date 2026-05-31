// Shared data shapes — the single source for these types across the app.
// See docs/SPEC.md §3.

export type Lang = "en" | "th";
export type ModeId = "time" | "words" | "lesson" | "race" | "ai";
export type Direction = "minimal" | "aurora" | "terminal";
export type Accent = "amber" | "violet" | "emerald" | "sky";

export interface RunConfig {
  time: 15 | 30 | 60;
  words: 10 | 25 | 50;
  lesson: string; // lesson id
  level: 1 | 2 | 3 | 4 | 5;
  aiText: string; // last generated/used AI passage
  aiTopic: string;
}

export interface Sample {
  t: number; // seconds since start
  wpm: number;
}

export interface RunResult {
  wpm: number;
  raw: number;
  cpm: number;
  acc: number;
  chars: number;
  errors: number;
  time: number; // seconds
  mode: ModeId;
  lang: Lang;
  samples: Sample[];
  errorsAt: number[]; // seconds where an error occurred
  heat: Record<string, number>; // physical KeyboardEvent.code -> error count
  label: string; // e.g. "30s", "25 words", "Level 3"
  raceWon?: boolean; // race mode only
  at: number; // Date.now()
}

export interface Settings {
  lang: Lang;
  direction: Direction;
  dark: boolean;
  accent: Accent;
  glow: number; // 0..100
  font: "geist" | "system";
  showKeyboard: boolean;
  heatmap: boolean;
}

export interface Lesson {
  id: string;
  name: { en: string; th: string };
  words: string[];
}
