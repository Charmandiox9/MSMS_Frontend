import { afterEach, describe, expect, it, vi } from "vitest";
import { installFakeApi } from "@/test/fake-api";
import { teachersApi } from "@/test/fixtures";
import type { TeacherSchedule } from "@/types/justifications";
import {
  fetchAllTeachers,
  fetchTeacherSchedule,
  teachersPath,
} from "./teachers";

describe("fetchTeacherSchedule", () => {
  afterEach(() => vi.unstubAllGlobals());

  const schedule: TeacherSchedule = {
    teacher: { id: "t-1", name: "Ana", email: "ana@ucn.cl" },
    semester: { id: "sem-1", name: "2026-2" },
    blocks: [{ code: "A", startsAt: "08:10", endsAt: "09:40" }],
    entries: [
      {
        id: "s-1",
        kind: "COURSE",
        day: "Lunes",
        block: "A",
        startsAt: "08:10",
        endsAt: "09:40",
        nrc: "10001",
        assistantshipNrc: null,
        course: { id: "c-1", code: "MAT-101", name: "Cálculo" },
        location: "Sala 1",
        assistant: null,
        state: null,
        conflict: false,
      },
      {
        id: "a-1",
        kind: "ASSISTANTSHIP",
        day: "Martes",
        block: "",
        startsAt: "10:00",
        endsAt: "11:00",
        nrc: "10001",
        assistantshipNrc: "20001",
        course: { id: "c-1", code: "MAT-101", name: "Cálculo" },
        location: "Lab 3",
        assistant: { id: "ta-1", name: "Pedro", email: "pedro@ucn.cl" },
        state: "ACTIVE",
        conflict: false,
      },
    ],
  };

  it("pide el horario del docente indicado", async () => {
    const api = installFakeApi({
      "GET /academic/teachers/t-1/schedule": () => ({ body: schedule }),
    });

    await expect(fetchTeacherSchedule("t-1")).resolves.toEqual(schedule);
    expect(api.calls("GET /academic/teachers/t-1/schedule")).toHaveLength(1);
  });

  it("propaga el mensaje del backend si el docente no existe", async () => {
    installFakeApi({
      "GET /academic/teachers/t-x/schedule": () => ({
        status: 404,
        body: { message: "El docente no existe" },
      }),
    });

    await expect(fetchTeacherSchedule("t-x")).rejects.toThrow(
      "El docente no existe",
    );
  });
});

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
