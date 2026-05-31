import { describe, it, expect } from "vitest";
import {
  pushSample,
  markError,
  ghostIndex,
  ghostCharsPerSecond,
  raceWon,
  RACE_TARGET_WPM,
} from "./sampling";

describe("pushSample", () => {
  it("appends one sample with the WPM at that second", () => {
    const s1 = pushSample([], 1, 5); // 5 chars in 1s -> (1 word)/(1/60) = 60 wpm
    expect(s1).toEqual([{ t: 1, wpm: 60 }]);
    const s2 = pushSample(s1, 2, 10); // 10 chars in 2s -> (2)/(2/60) = 60 wpm
    expect(s2).toHaveLength(2);
    expect(s2[1]).toEqual({ t: 2, wpm: 60 });
  });
});

describe("markError", () => {
  it("records the second of an error", () => {
    expect(markError([], 3)).toEqual([3]);
    expect(markError([3], 4)).toEqual([3, 4]);
  });
  it("de-duplicates consecutive errors in the same second", () => {
    expect(markError([3], 3)).toEqual([3]);
  });
  it("floors and clamps the second", () => {
    expect(markError([], 4.9)).toEqual([4]);
    expect(markError([], -2)).toEqual([0]);
  });
});

describe("ghost (race pace marker)", () => {
  it("advances at targetWPM*5/60 chars per second", () => {
    expect(ghostCharsPerSecond(60)).toBeCloseTo(5);
    expect(ghostCharsPerSecond(RACE_TARGET_WPM[3])).toBeCloseTo((50 * 5) / 60);
  });
  it("returns a capped character index for elapsed time", () => {
    expect(ghostIndex(50, 12, 100)).toBe(50); // 4.1667 c/s * 12s = 50
    expect(ghostIndex(20, 0, 100)).toBe(0);
    expect(ghostIndex(80, 1000, 100)).toBe(100); // capped at text length
  });
  it("wins only when the user finishes before the ghost target time", () => {
    expect(raceWon(60, 20, 100)).toBe(true);
    expect(raceWon(60, 20.001, 100)).toBe(false);
  });
  it("has a strictly increasing per-level target table", () => {
    const levels = [1, 2, 3, 4, 5];
    for (let i = 1; i < levels.length; i++) {
      expect(RACE_TARGET_WPM[levels[i]]).toBeGreaterThan(RACE_TARGET_WPM[levels[i - 1]]);
    }
  });
});
