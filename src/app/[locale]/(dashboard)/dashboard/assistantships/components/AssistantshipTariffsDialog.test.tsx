import { fireEvent, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../../../messages/es.json";
import { render } from "@testing-library/react";
import { TARIFFS } from "../graphql";
import AssistantshipTariffsDialog from "./AssistantshipTariffsDialog";

const toastMock = vi.hoisted(() => ({
  promise: vi.fn((promise: Promise<unknown>) => promise),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

describe("AssistantshipTariffsDialog", () => {
  afterEach(() => vi.clearAllMocks());

  it("formats the CLP tariff with thousands separators while typing", async () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <MockedProvider mocks={[
          { request: { query: TARIFFS, variables: { semesterId: "sem" } }, result: { data: { assistantshipTariffs: [] } }, maxUsageCount: 3 },
        ]}>
          <AssistantshipTariffsDialog semesterId="sem" semesterName="2026-2" onClose={vi.fn()} />
        </MockedProvider>
      </NextIntlClientProvider>,
    );
    const rate = await screen.findByLabelText("Tarifa mensual (CLP)");
    fireEvent.change(rate, { target: { value: "30000" } });
    expect((rate as HTMLInputElement).value).toBe("30.000");
  });
});
