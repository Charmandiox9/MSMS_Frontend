import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAs } from "@/test/render";
import { fail, installFakeApi, ok } from "@/test/fake-api";
import type {
  HourlyContractInput,
  HourlyPaymentPreview,
} from "@/types/hourly-payments";
import HourlyContractsEditor from "./HourlyContractsEditor";

const catalog = {
  semester: {
    id: "semester",
    name: "2026-20",
    startsOn: "2026-08-17",
    endsOn: "2026-12-19",
  },
  rates: [
    {
      id: "rate",
      semesterId: "semester",
      category: "NEW",
      academicDegree: "PROFESSIONAL",
      certification: "NONE",
      hourlyRateClp: "52000",
    },
  ],
};
const line: HourlyContractInput = {
  id: "contract",
  nrc: "10001",
  payRateId: "rate",
  component: "LABORATORY",
  parallel: "L3",
  directHours: 3,
  startsOn: "2026-08-17",
  endsOn: "2026-12-19",
};
const calculation = {
  monthlyAmountClp: "156000",
  months: [{ month: "2026-08", days: 14, amountClp: "72800" }],
  totalAmountClp: "639600",
};
const response: HourlyPaymentPreview = {
  lines: [{ ...line, calculation }],
  totalAmountClp: "639600",
};
function Harness({ teacherId }: { teacherId?: string }) {
  const [lines, setLines] = useState<HourlyContractInput[]>([]);
  const [ready, setReady] = useState(false);
  return (
    <>
      <HourlyContractsEditor
        semesterId="semester"
        teacherId={teacherId}
        courses={[
          {
            courseId: "course",
            nrc: "10001",
            name: "Biología",
            code: "BM",
            teachers: [],
          },
        ]}
        value={lines}
        onChange={setLines}
        onReady={setReady}
        disabled={false}
      />
      <button disabled={!ready}>Guardar prueba</button>
    </>
  );
}

describe("Contratos PH", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("carga contratos existentes y muestra los pagos calculados por el backend", async () => {
    const api = installFakeApi({
      "GET /academic/hourly-payments/rates": ok(catalog),
      "GET /academic/hourly-payments/teachers/teacher": ok({
        semesterId: "semester",
        contracts: [{ ...line, directHours: "3.00", calculation }],
      }),
      "POST /academic/hourly-payments/preview": ok(response),
    });
    renderAs(<Harness teacherId="teacher" />);
    await screen.findByText(/Total del semestre/);
    expect(screen.getByLabelText("Horas directas")).toHaveProperty(
      "value",
      "3",
    );
    expect(
      api.calls("POST /academic/hourly-payments/preview")[0].body,
    ).toMatchObject({ teacherId: "teacher", contracts: [line] });
    expect(
      screen.getByRole("button", { name: "Guardar prueba" }),
    ).toHaveProperty("disabled", false);
    fireEvent.change(screen.getByLabelText("Horas directas"), {
      target: { value: "1.5" },
    });
    expect(
      screen.getByRole("button", { name: "Guardar prueba" }),
    ).toHaveProperty("disabled", true);
    await waitFor(() =>
      expect(api.calls("POST /academic/hourly-payments/preview")).toHaveLength(
        2,
      ),
    );
    expect(
      api.calls("POST /academic/hourly-payments/preview")[1].body,
    ).toMatchObject({ contracts: [{ ...line, directHours: 1.5 }] });
  });
  it("mantiene el guardado bloqueado si no se pueden cargar los contratos", async () => {
    installFakeApi({
      "GET /academic/hourly-payments/rates": ok(catalog),
      "GET /academic/hourly-payments/teachers/teacher": fail(
        500,
        "No disponible",
      ),
    });
    renderAs(<Harness teacherId="teacher" />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "No disponible",
    );
    expect(
      screen.getByRole("button", { name: "Guardar prueba" }),
    ).toHaveProperty("disabled", true);
  });
  it("rechaza un cambio de semestre y permite añadir contratos nuevos sin pagos inventados", async () => {
    const api = installFakeApi({
      "GET /academic/hourly-payments/rates": ok({
        ...catalog,
        semester: { ...catalog.semester, id: "other" },
      }),
    });
    renderAs(<Harness />);
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Guardar prueba" }),
    ).toHaveProperty("disabled", true);
    api.on("GET /academic/hourly-payments/rates", ok(catalog));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Añadir contrato PH" }),
    );
    expect(
      screen.getByRole("button", { name: "Guardar prueba" }),
    ).toHaveProperty("disabled", true);
    expect(api.calls("POST /academic/hourly-payments/preview")).toHaveLength(0);
  });
});
