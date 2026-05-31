// Pure typing metrics. No globals, no DOM — trivially unit-tested.
// Formulas are fixed in docs/SPEC.md §4.
//
// Counter semantics (maintained by the engine):
//   totalKeystrokes   = character-producing presses (excludes Backspace/modifiers)
//   correctKeystrokes = those that matched the expected character
//   errors            = totalKeystrokes - correctKeystrokes
// Backspace never adds/removes a keystroke; a retype counts as a new keystroke, so
// corrections cannot inflate accuracy back to 100%.

const finiteInt = (n: number): number => (Number.isFinite(n) ? Math.round(n) : 0);

/** Words per minute = (correctChars / 5) / minutes. The /5 is the cross-language convention. */
export function wpm(correctChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return finiteInt(correctChars / 5 / (seconds / 60));
}

/** Raw WPM counts every produced character, errors included. */
export function rawWpm(totalChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return finiteInt(totalChars / 5 / (seconds / 60));
}

/** Characters per minute — the honest figure for Thai (no inter-word spaces). */
export function cpm(correctChars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return finiteInt(correctChars / (seconds / 60));
}

/** Accuracy % = correctKeystrokes / totalKeystrokes. Empty run reads as 100%. */
export function accuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}
