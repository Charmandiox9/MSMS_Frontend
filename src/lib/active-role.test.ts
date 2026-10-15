import { describe, expect, it } from "vitest";
import { getSessionRoles } from "./active-role";
describe("getSessionRoles", () => {
  it.each([{}, { roles: null }, { roles: "SYSTEM_ADMIN" }, { roles: 123 }])(
    "no falla con roles ausentes o inválidos",
    (session) => {
      expect(getSessionRoles(session)).toEqual([]);
    },
  );
  it("conserva solo roles conocidos sin duplicados y mantiene su orden", () => {
    expect(
      getSessionRoles({
        roles: [
          "SYSTEM_ADMIN",
          null,
          "INVALID",
          "ACADEMIC_SECRETARY",
          "SYSTEM_ADMIN",
        ],
      }),
    ).toEqual(["SYSTEM_ADMIN", "ACADEMIC_SECRETARY"]);
  });
});
