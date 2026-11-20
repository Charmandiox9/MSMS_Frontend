import { describe, expect, it } from "vitest";
import { resolveAuthCallbackTarget } from "./auth-callback-route";

describe("resolveAuthCallbackTarget", () => {
  it("keeps the dashboard home destination", () => {
    expect(resolveAuthCallbackTarget("/dashboard")).toBe("/dashboard");
  });

  it("keeps an internal dashboard route", () => {
    expect(resolveAuthCallbackTarget("/dashboard/students")).toBe(
      "/dashboard/students",
    );
  });

  it("rejects destinations outside the application", () => {
    expect(resolveAuthCallbackTarget("https://example.com")).toBe("/");
    expect(resolveAuthCallbackTarget("//example.com")).toBe("/");
    expect(resolveAuthCallbackTarget(undefined)).toBe("/");
  });
});
