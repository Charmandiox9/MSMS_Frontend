import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok, fail } from "@/test/fake-api";
import CourseTeachersDialog from "./CourseTeachersDialog";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));
const teachers = [
  {
    id: "teacher-1",
    name: "Ana Soto",
    email: "ana@example.com",
    assignments: [],
  },
  {
    id: "teacher-2",
    name: "Pedro Pérez",
    email: "pedro@example.com",
    assignments: [],
  },
];
const catalog = {
  semester: { id: "semester", name: "2026-2" },
  courses: [
    {
      nrc: "10001",
      name: "Biología marina",
      courseId: "course",
      code: null,
      teachers: [teachers[0]],
    },
  ],
};
describe("CourseTeachersDialog", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("permite sustituir los docentes vinculados desde la asignatura", async () => {
    const api = installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/teachers": ok({
        items: teachers,
        total: 2,
        totalPages: 1,
        page: 1,
        pageSize: 100,
      }),
      "PUT /academic/courses/10001/teachers": ok({
        nrc: "10001",
        teacherIds: ["teacher-2"],
      }),
    });
    const saved = vi.fn();
    renderAs(
      <CourseTeachersDialog
        nrc="10001"
        name="Biología marina"
        onClose={vi.fn()}
        onSaved={saved}
      />,
    );
    const ana = await screen.findByLabelText(/Ana Soto/);
    expect(ana).toHaveProperty("checked", true);
    fireEvent.click(ana);
    fireEvent.click(screen.getByLabelText(/Pedro Pérez/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar vínculos" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(api.calls("PUT /academic/courses/10001/teachers")[0].body).toEqual({
      semesterId: "semester",
      teacherIds: ["teacher-2"],
    });
  });
  it("muestra el rechazo del backend y conserva el diálogo", async () => {
    installFakeApi({
      "GET /academic/courses/current": ok(catalog),
      "GET /academic/teachers": ok({
        items: teachers,
        total: 2,
        totalPages: 1,
        page: 1,
        pageSize: 100,
      }),
      "PUT /academic/courses/10001/teachers": fail(
        409,
        "El semestre activo cambió",
      ),
    });
    const saved = vi.fn();
    renderAs(
      <CourseTeachersDialog
        nrc="10001"
        name="Biología marina"
        onClose={vi.fn()}
        onSaved={saved}
      />,
    );
    await screen.findByLabelText(/Ana Soto/);
    fireEvent.click(screen.getByRole("button", { name: "Guardar vínculos" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "El semestre activo cambió",
    );
    expect(saved).not.toHaveBeenCalled();
  });
});
