import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentProgressPage from "./StudentProgressPage";
import { apiFetch } from "@/lib/api";
import { renderAs } from "@/test/render";
import type { StudentProgress } from "@/types/careers";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

function createProgress(
  career: StudentProgress["student"]["career"],
): StudentProgress {
  return {
    student: {
      id: "student-1",
      name: "Alumno Ficticio",
      email: "",
      career,
      curriculumVersion: null,
    },
    courses: [],
    attempts: [],
    summary: {
      totalCourses: 0,
      passedCourses: 0,
      enrolledCourses: 0,
      progressPercent: 0,
    },
  };
}

function mockProgressResponse(progress: StudentProgress) {
  const responses = new Map<string, unknown>([
    ["/academic/students/student-1/progress", progress],
    ["/academic/semesters", []],
  ]);
  vi.mocked(apiFetch).mockImplementation(
    async <T,>(path: string): Promise<T> => responses.get(path) as T,
  );
}

describe("StudentProgressPage curriculum availability", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiFetch).mockReset();
  });

  it("explains that the cohort is missing when the career is linked", async () => {
    mockProgressResponse(
      createProgress({ id: "career-1", code: "BM", name: "Biología Marina" }),
    );

    renderAs(<StudentProgressPage studentId="student-1" />, [
      "ACADEMIC_PROCESS_ANALYST",
    ]);

    expect(
      await screen.findByText(
        "La carrera está vinculada, pero falta confirmar la cohorte de ingreso para asociar la malla.",
      ),
    ).toBeDefined();
    expect(screen.getByText("Biología Marina")).toBeDefined();
  });

  it("reports a missing career when no career is linked", async () => {
    mockProgressResponse(createProgress(null));

    renderAs(<StudentProgressPage studentId="student-1" />, [
      "ACADEMIC_PROCESS_ANALYST",
    ]);

    expect(
      await screen.findByText("Este alumno no tiene una carrera vinculada."),
    ).toBeDefined();
  });
});
