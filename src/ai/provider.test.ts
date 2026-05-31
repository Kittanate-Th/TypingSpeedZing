import { describe, expect, it } from "vitest";

import { generatePassage } from "./provider";

describe("generatePassage", () => {
  it("returns non-empty local English practice text", async () => {
    const result = await generatePassage({ lang: "en", topic: "focus" });

    expect(result.source).toBe("local");
    expect(result.text.trim().length).toBeGreaterThan(0);
    expect(result.text).toMatch(/[a-z]/i);
  });

  it("returns non-empty local Thai practice text", async () => {
    const result = await generatePassage({ lang: "th", topic: "สมาธิ" });

    expect(result.source).toBe("local");
    expect(result.text.trim().length).toBeGreaterThan(0);
    expect(result.text).toMatch(/[^a-z0-9\s.,!?()[\]{}"'/%@#;:+_-]/i);
  });

  it("never rejects, even with a troublesome topic", async () => {
    await expect(generatePassage({ lang: "en", topic: "\u0000".repeat(20) })).resolves.toEqual(
      expect.objectContaining({
        source: "local",
        text: expect.any(String),
      }),
    );
  });
});
