import { afterEach, describe, expect, it, vi } from "vitest";
import { installFakeApi } from "@/test/fake-api";
import { teachersApi } from "@/test/fixtures";
import { fetchAllTeachers, teachersPath } from "./teachers";

describe("teachersPath", () => {
  it("incluye página y tamaño, y omite filtros vacíos", () => {
    expect(teachersPath({ page: 2, pageSize: 10, search: "   " })).toBe(
      "/academic/teachers?page=2&pageSize=10",
    );
  });

  it("recorta la búsqueda y envía isActive=false explícito", () => {
    expect(
      teachersPath({ page: 1, pageSize: 10, search: " Ana ", isActive: false }),
    ).toBe("/academic/teachers?page=1&pageSize=10&search=Ana&isActive=false");
  });
});

describe("fetchAllTeachers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("recorre todas las páginas del backend", async () => {
    const teachers = Array.from({ length: 205 }, (_, index) => ({
      id: `t-${index}`,
      name: `Profesor ${index}`,
      email: `p${index}@ucn.cl`,
      assignments: [],
    }));
    const api = installFakeApi({
      "GET /academic/teachers": teachersApi(teachers),
    });

    await expect(fetchAllTeachers()).resolves.toEqual(teachers);
    expect(
      api
        .calls("GET /academic/teachers")
        .map((request) => request.query.get("page")),
    ).toEqual(["1", "2", "3"]);
  });

  it("hace una sola petición si no hay docentes", async () => {
    const api = installFakeApi({ "GET /academic/teachers": teachersApi([]) });

    await expect(fetchAllTeachers()).resolves.toEqual([]);
    expect(api.calls("GET /academic/teachers")).toHaveLength(1);
  });
});
