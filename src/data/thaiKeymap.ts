// Keyboard layout + Thai (Kedmanee) → physical-key map.
//
// The prototype shipped a hand-written `TH_TO_PHYSICAL` table that was scrambled
// relative to the rendered keyboard (e.g. ไ pointed at KeyQ but the board drew ไ
// on KeyW) and contained junk ("ุ":"KeyKeyDummy"). We eliminate that whole bug
// class by DERIVING the Thai map from the one canonical layout below, so a
// highlighted key is always the key actually showing that glyph.
// See docs/SPEC.md §7.

// [code, latin, latinShift, thaiBase, thaiShift]
export type KeyDef = [string, string, string, string, string];

export const KB_ROWS: KeyDef[][] = [
  [
    ["Backquote", "`", "~", "ฺ", "ฤ"], ["Digit1", "1", "!", "ๅ", "+"],
    ["Digit2", "2", "@", "/", "๑"], ["Digit3", "3", "#", "-", "๒"],
    ["Digit4", "4", "$", "ภ", "๓"], ["Digit5", "5", "%", "ถ", "๔"],
    ["Digit6", "6", "^", "ุ", "ู"], ["Digit7", "7", "&", "ึ", "฿"],
    ["Digit8", "8", "*", "ค", "๕"], ["Digit9", "9", "(", "ต", "๖"],
    ["Digit0", "0", ")", "จ", "๗"], ["Minus", "-", "_", "ข", "๘"],
    ["Equal", "=", "+", "ช", "๙"],
  ],
  [
    ["KeyQ", "q", "Q", "ๆ", "๐"], ["KeyW", "w", "W", "ไ", '"'],
    ["KeyE", "e", "E", "ำ", "ฎ"], ["KeyR", "r", "R", "พ", "ฑ"],
    ["KeyT", "t", "T", "ะ", "ธ"], ["KeyY", "y", "Y", "ั", "ํ"],
    ["KeyU", "u", "U", "ี", "๊"], ["KeyI", "i", "I", "ร", "ณ"],
    ["KeyO", "o", "O", "น", "ฯ"], ["KeyP", "p", "P", "ย", "ญ"],
    ["BracketLeft", "[", "{", "บ", "ฐ"], ["BracketRight", "]", "}", "ล", ","],
  ],
  [
    ["KeyA", "a", "A", "ฟ", "ฤ"], ["KeyS", "s", "S", "ห", "ฆ"],
    ["KeyD", "d", "D", "ก", "ฏ"], ["KeyF", "f", "F", "ด", "โ"],
    ["KeyG", "g", "G", "เ", "ฌ"], ["KeyH", "h", "H", "้", "็"],
    ["KeyJ", "j", "J", "่", "๋"], ["KeyK", "k", "K", "า", "ษ"],
    ["KeyL", "l", "L", "ส", "ศ"], ["Semicolon", ";", ":", "ว", "ซ"],
    ["Quote", "'", '"', "ง", "."],
  ],
  [
    ["KeyZ", "z", "Z", "ผ", "("], ["KeyX", "x", "X", "ป", ")"],
    ["KeyC", "c", "C", "แ", "ฉ"], ["KeyV", "v", "V", "อ", "ฮ"],
    ["KeyB", "b", "B", "ิ", "ฺ"], ["KeyN", "n", "N", "ื", "์"],
    ["KeyM", "m", "M", "ท", "?"], ["Comma", ",", "<", "ม", "ฒ"],
    ["Period", ".", ">", "ใ", "ฬ"], ["Slash", "/", "?", "ฝ", "ฦ"],
  ],
];

/** Thai glyph → physical KeyboardEvent.code, derived from KB_ROWS (base + shift). */
export const THAI_TO_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const row of KB_ROWS) {
    for (const [code, , , thBase, thShift] of row) {
      if (thBase && !(thBase in map)) map[thBase] = code;
      if (thShift && !(thShift in map)) map[thShift] = code;
    }
  }
  return map;
})();

/** Which physical key produces `ch` in the given language (for next-key highlight). */
export function physicalForChar(ch: string, lang: "en" | "th"): string | null {
  if (ch === " ") return "Space";
  if (lang === "th") {
    const code = THAI_TO_CODE[ch];
    if (code) return code;
  }
  const lower = ch.toLowerCase();
  for (const row of KB_ROWS) {
    for (const k of row) {
      if (k[1] === lower || k[1] === ch || k[2] === ch) return k[0];
    }
  }
  return null;
}
