import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { MockedProvider } from "@apollo/client/testing/react";
import { GraphQLError } from "graphql";
import messages from "../../../../../../../messages/es.json";
import {
  ASSIGNMENTS,
  HISTORY,
  OPTIONS,
  REGISTER,
  type Assistantship,
  type Filters,
} from "../graphql";
import { AssistantshipsWorkspace } from "./AssistantshipsManager";
import RegisterAssistantshipDialog from "./RegisterAssistantshipDialog";

const notifications = vi.hoisted(() => ({
  pending: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    promise: (
      promise: Promise<unknown>,
      options: {
        loading: string;
        success: string;
        error: (error: unknown) => string;
      },
    ) => {
      notifications.pending(options.loading);
      void promise.then(
        () => notifications.success(options.success),
        (error: unknown) => notifications.error(options.error(error)),
      );
      return 123;
    },
  },
}));
const semester = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "2026-2",
  startsOn: "2026-08-01",
  endsOn: "2026-12-31",
  isActive: true,
};
const item: Assistantship & { __typename: "AssistantshipView" } = {
  __typename: "AssistantshipView",
  id: "record",
  assistantName: "Ana Pérez",
  assistantEmail: "ana@example.test",
  studentCode: "123",
  courseName: "Biología marina",
  courseCode: "BIO101",
  nrc: "12345",
  teacherName: "Docente",
  semesterId: semester.id,
  semesterName: semester.name,
  approvedOn: "2026-07-01",
  startsOn: semester.startsOn,
  endsOn: semester.endsOn,
  weeklyHours: 4,
  state: "ACTIVE",
  schedules: [],
};
const optionsMock = {
  request: { query: OPTIONS },
  result: {
    data: {
      assistantshipOptions: {
        semesters: [semester],
        teachers: [{ id: "teacher", name: "Docente" }],
        blocks: [
          { code: "A", startsAtMinute: 490, endsAtMinute: 580 },
          { code: "H", startsAtMinute: 1290, endsAtMinute: 1380 },
        ],
      },
    },
  },
  maxUsageCount: 20,
};
const assignmentsMock = {
  request: { query: ASSIGNMENTS, variables: { semesterId: semester.id } },
  result: {
    data: {
      assistantshipAssignments: [
        {
          id: "assignment",
          courseName: "Biología marina",
          courseCode: "BIO101",
          nrc: "12345",
          teacherName: "Docente",
        },
      ],
    },
  },
  maxUsageCount: 20,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => vi.clearAllMocks());

describe("assistantship management", () => {
  it("loads records and sends semester/status/search filters to the server", async () => {
    const result = vi.fn(({ filters }: { filters: Filters }) => ({
      data: {
        assistantships: {
          items: filters.search === "missing" ? [] : [item],
          total: 1,
          assistants: 1,
          semesters: 1,
          page: filters.page,
          totalPages: 1,
        },
      },
    }));
    const historyMock = {
      request: { query: HISTORY, variables: () => true },
      result,
      maxUsageCount: 20,
    };
    render(
      <NextIntlClientProvider
        locale="es"
        messages={messages}
        timeZone="America/Santiago"
      >
        <MockedProvider mocks={[optionsMock, historyMock]}>
          <AssistantshipsWorkspace />
        </MockedProvider>
      </NextIntlClientProvider>,
    );
    expect(await screen.findByText("Ana Pérez")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Semestre"), {
      target: { value: semester.id },
    });
    await waitFor(() =>
      expect(result).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            semesterId: semester.id,
            page: 1,
          }),
        }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "COMPLETED" },
    });
    await waitFor(() =>
      expect(result).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ state: "COMPLETED" }),
        }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: "missing" },
    });
    expect(
      await screen.findByText("No hay ayudantías para esta consulta"),
    ).toBeDefined();
    expect(result).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ search: "missing", page: 1 }),
      }),
    );
  });

  it("shows a retry action on load failure", async () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <MockedProvider
          mocks={[
            optionsMock,
            {
              request: { query: HISTORY, variables: () => true },
              error: new Error("offline"),
            },
          ]}
        >
          <AssistantshipsWorkspace />
        </MockedProvider>
      </NextIntlClientProvider>,
    );
    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  const fillRegistration = async () => {
    const assignmentSelect = await screen.findByLabelText(
      "Asignatura, NRC y profesor",
    );
    await screen.findByRole("option", { name: /Biología marina/ });
    fireEvent.change(assignmentSelect, { target: { value: "assignment" } });
    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Ana Pérez" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ana@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de aprobación"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
  };

  it("keeps the modal open while saving and closes only after the mutation succeeds", async () => {
    const onRegistered = vi.fn();
    const result = vi.fn(() => ({ data: { registerAssistantship: item } }));
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <MockedProvider
          mocks={[
            assignmentsMock,
            {
              request: { query: REGISTER, variables: () => true },
              result,
              delay: 100,
            },
          ]}
        >
          <RegisterAssistantshipDialog
            semesters={[semester]}
            blocks={optionsMock.result.data.assistantshipOptions.blocks}
            onClose={vi.fn()}
            onRegistered={onRegistered}
          />
        </MockedProvider>
      </NextIntlClientProvider>,
    );
    await fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Agregar horario" }));
    expect(screen.getByRole("option", { name: "A · 08:10–09:40" })).toBeDefined();
    expect(screen.getByRole("option", { name: "H · 21:30–23:00" })).toBeDefined();
    expect(document.querySelector('input[type="time"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Guardar ayudantía" }));
    expect(notifications.pending).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Bloque horario"), {
      target: { value: "H" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar ayudantía" }));
    expect(onRegistered).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeDefined();
    await waitFor(() => expect(onRegistered).toHaveBeenCalledWith(semester.id));
    expect(result).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          teachingAssignmentId: "assignment",
          assistantEmail: "ana@example.test",
          approvalConfirmed: true,
          schedules: [{ weekday: 1, startsAtMinute: 1290, endsAtMinute: 1380 }],
        }),
      }),
    );
    expect(notifications.success).toHaveBeenCalledWith(
      "Ayudantía registrada correctamente.",
    );
  });

  it("keeps the entered values after a conflict and displays a translated notification", async () => {
    const onRegistered = vi.fn();
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <MockedProvider
          mocks={[
            assignmentsMock,
            {
              request: { query: REGISTER, variables: () => true },
              result: {
                errors: [
                  new GraphQLError("conflict", {
                    extensions: { originalError: { code: "DUPLICATE" } },
                  }),
                ],
              },
            },
          ]}
        >
          <RegisterAssistantshipDialog
            semesters={[semester]}
            blocks={optionsMock.result.data.assistantshipOptions.blocks}
            onClose={vi.fn()}
            onRegistered={onRegistered}
          />
        </MockedProvider>
      </NextIntlClientProvider>,
    );
    await fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Guardar ayudantía" }));
    await waitFor(() =>
      expect(notifications.error).toHaveBeenCalledWith(
        "La ayudantía o el correo/código estudiantil ya está registrado.",
      ),
    );
    expect(
      (screen.getByLabelText("Nombre completo") as HTMLInputElement).value,
    ).toBe("Ana Pérez");
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(onRegistered).not.toHaveBeenCalled();
  });
});
