// Pure helpers for live sampling and the Race pace-ghost. See docs/SPEC.md §5–§6.
import type { Sample } from "../types";
import { wpm } from "./metrics";

/** Per-level target WPM the ghost types at (docs/SPEC.md §Race). */
export const RACE_TARGET_WPM: Record<number, number> = {
  1: 20,
  2: 35,
  3: 50,
  4: 65,
  5: 80,
};

/** Append one WPM sample for a completed second. Caller advances `second`. */
export function pushSample(samples: Sample[], second: number, correctChars: number): Sample[] {
  return [...samples, { t: second, wpm: wpm(correctChars, second) }];
}

/** Record the second an error happened, de-duplicating consecutive same-second errors. */
export function markError(errorsAt: number[], second: number): number[] {
  const s = Math.max(0, Math.floor(second));
  if (errorsAt.length && errorsAt[errorsAt.length - 1] === s) return errorsAt;
  return [...errorsAt, s];
}

/** Characters per second the ghost advances at a target WPM. */
export function ghostCharsPerSecond(targetWpm: number): number {
  return (targetWpm * 5) / 60;
}

/** Ghost caret position (character index) at `elapsed` seconds, capped to text length. */
export function ghostIndex(targetWpm: number, elapsed: number, textLength: number): number {
  return Math.min(textLength, Math.floor(ghostCharsPerSecond(targetWpm) * elapsed));
}

/** User wins race when completed text before or exactly as the ghost reaches the finish. */
export function raceWon(targetWpm: number, elapsed: number, textLength: number): boolean {
  return elapsed <= textLength / ghostCharsPerSecond(targetWpm);
}
