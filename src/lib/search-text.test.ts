import { describe, expect, it } from "vitest";
import { findSearchMatches } from "./search-text";

describe("findSearchMatches", () => {
  it("preserves original offsets for accent-insensitive and repeated matches", () => {
    const text = "A\u0301lvarez, Álvarez";
    const matches = findSearchMatches(text, " ALVAREZ ");
    expect(matches.map(({ start, end }) => text.slice(start, end)))
      .toEqual(["A\u0301lvarez", "Álvarez"]);
  });

  it("treats punctuation as literal text", () => {
    expect(findSearchMatches("50%._", "%._")).toEqual([{ start: 2, end: 5 }]);
    expect(findSearchMatches("Biología", " ")).toEqual([]);
  });
});
