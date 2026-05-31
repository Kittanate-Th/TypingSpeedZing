import { describe, it, expect } from "vitest";
import { KB_ROWS, THAI_TO_CODE, physicalForChar } from "./thaiKeymap";
import { TH_WORDS } from "./words";

const VALID_CODES = new Set<string>([...KB_ROWS.flat().map((k) => k[0]), "Space"]);

describe("THAI_TO_CODE (derived from the layout)", () => {
  it("contains no junk values and only real key codes", () => {
    for (const [glyph, code] of Object.entries(THAI_TO_CODE)) {
      expect(typeof code).toBe("string");
      expect(code).not.toBe("KeyKeyDummy");
      expect(VALID_CODES.has(code), `${glyph} -> ${code}`).toBe(true);
    }
  });

  it("maps glyphs to the key that actually renders them (fixes prototype scramble)", () => {
    // The prototype mis-pointed these; derived map agrees with the drawn board.
    expect(physicalForChar("ไ", "th")).toBe("KeyW");
    expect(physicalForChar("ำ", "th")).toBe("KeyE");
    expect(physicalForChar("ุ", "th")).toBe("Digit6"); // was "KeyKeyDummy"
  });
});

describe("physicalForChar", () => {
  it("maps every character in the Thai word bank to a real key", () => {
    const missing: string[] = [];
    for (const word of TH_WORDS) {
      for (const ch of word) {
        const code = physicalForChar(ch, "th");
        if (!code || !VALID_CODES.has(code)) missing.push(`${ch}(${code})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("handles space and English keys", () => {
    expect(physicalForChar(" ", "th")).toBe("Space");
    expect(physicalForChar("a", "en")).toBe("KeyA");
    expect(physicalForChar("A", "en")).toBe("KeyA");
    expect(physicalForChar("1", "en")).toBe("Digit1");
  });
});
