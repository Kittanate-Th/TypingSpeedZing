import { describe, it, expect } from "vitest";
import { wpm, rawWpm, cpm, accuracy } from "./metrics";

describe("wpm", () => {
  it("is (chars/5) per minute", () => {
    expect(wpm(100, 60)).toBe(20); // 100/5 = 20 words in 1 min
    expect(wpm(250, 60)).toBe(50);
    expect(wpm(50, 30)).toBe(20); // 10 words in 0.5 min -> 20
  });
  it("guards zero/negative time (no Infinity/NaN)", () => {
    expect(wpm(100, 0)).toBe(0);
    expect(wpm(100, -5)).toBe(0);
    expect(wpm(0, 60)).toBe(0);
  });
});

describe("rawWpm", () => {
  it("counts all produced chars", () => {
    expect(rawWpm(300, 60)).toBe(60);
    expect(rawWpm(0, 0)).toBe(0);
  });
});

describe("cpm", () => {
  it("is characters (not /5) per minute", () => {
    expect(cpm(300, 60)).toBe(300);
    expect(cpm(150, 30)).toBe(300);
    expect(cpm(10, 0)).toBe(0);
  });
});

describe("accuracy", () => {
  it("is correct/total as a percent", () => {
    expect(accuracy(90, 100)).toBe(90);
    expect(accuracy(1, 3)).toBe(33);
  });
  it("treats an empty run as 100%", () => {
    expect(accuracy(0, 0)).toBe(100);
  });
  it("backspace+retype does not restore accuracy to 100%", () => {
    // One wrong attempt then a correct retype = 1 correct of 2 total keystrokes.
    // Even though the final visible text is correct, accuracy reflects both attempts.
    expect(accuracy(1, 2)).toBe(50);
  });
});
