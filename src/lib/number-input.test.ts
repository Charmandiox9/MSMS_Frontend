import { describe, expect, it } from "vitest";
import { formatDecimalInput, parseDecimalInput } from "./number-input";

describe("decimal inputs", () => {
  it("accepts decimal keyboard and grouped pasted amounts", () => {
    expect(parseDecimalInput("1234,50")).toBe("1234.50");
    expect(parseDecimalInput("1.234,50")).toBe("1234.50");
    expect(parseDecimalInput("1,234.50")).toBe("1234.50");
    expect(parseDecimalInput("")).toBe("");
    expect(parseDecimalInput("12.")).toBe("12.");
  });
  it("rejects negatives, letters and excess precision without rounding", () => {
    for (const value of ["-10", "abc", "12.345", "1e3"])
      expect(parseDecimalInput(value)).toBeNull();
  });
  it("formats without losing precision or converting empty values to zero", () => {
    expect(formatDecimalInput("1234567890123456.50", "es")).toBe(
      "1.234.567.890.123.456,50",
    );
    expect(formatDecimalInput("1234.50", "en")).toBe("1,234.50");
    expect(formatDecimalInput("", "es")).toBe("");
  });
});
