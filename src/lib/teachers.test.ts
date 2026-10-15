import { afterEach, describe, expect, it, vi } from "vitest";
import { installFakeApi, ok } from "@/test/fake-api";
import { fetchAllTeachers } from "./teachers";

describe("fetchAllTeachers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads teachers on later pages for course associations", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": ({ query }) => ({ body: {
        items: [{ id: `teacher-${query.get("page")}`, name: "Docente", email: "teacher@example.com", assignments: [] }],
        total: 101, page: Number(query.get("page")), pageSize: 100, totalPages: 2,
      } }),
    });
    expect((await fetchAllTeachers()).map(({ id }) => id)).toEqual(["teacher-1", "teacher-2"]);
    expect(api.calls("GET /academic/teachers").map(({ query }) => query.get("page"))).toEqual(["1", "2"]);
  });

  it("returns an empty list when there are no teachers", async () => {
    const api = installFakeApi({
      "GET /academic/teachers": ok({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }),
    });
    expect(await fetchAllTeachers()).toEqual([]);
    expect(api.calls("GET /academic/teachers")).toHaveLength(1);
  });
});
