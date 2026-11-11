import { fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { installFakeApi, ok } from "@/test/fake-api";
import DepartmentField from "./DepartmentField";
afterEach(() => vi.unstubAllGlobals());
it("loads persisted careers and allows assigning or clearing a department", async () => {
  installFakeApi({
    "GET /academic/careers/options": ok([
      { id: "career", name: "Biología Marina" },
    ]),
  });
  const change = vi.fn();
  renderAs(<DepartmentField value="" onChange={change} />, [
    "ACADEMIC_SECRETARY",
  ]);
  await screen.findByRole("option", { name: "Biología Marina" });
  fireEvent.change(screen.getByLabelText("Departamento"), {
    target: { value: "career" },
  });
  expect(change).toHaveBeenLastCalledWith("career");
  fireEvent.change(screen.getByLabelText("Departamento"), {
    target: { value: "" },
  });
  expect(change).toHaveBeenLastCalledWith("");
});
