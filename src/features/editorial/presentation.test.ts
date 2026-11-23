import { describe, expect, it } from "vitest";
import { matchesEditorialAudience } from "./presentation";

describe("editorial role preview", () => {
  it("includes a global publication even without an active role", () => {
    expect(matchesEditorialAudience([], null)).toBe(true);
  });

  it("only previews a restricted publication for a selected member of its audience", () => {
    const audience = ["ACADEMIC_SECRETARY", "TEACHING_SUPPORT_COORDINATOR"];
    expect(matchesEditorialAudience(audience, "TEACHING_SUPPORT_COORDINATOR")).toBe(true);
    expect(matchesEditorialAudience(audience, "SYSTEM_ADMIN")).toBe(false);
    expect(matchesEditorialAudience(audience, null)).toBe(false);
  });
});
