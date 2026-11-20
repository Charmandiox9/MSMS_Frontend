import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";
import * as terms from "@/lib/legal-terms";
import TermsAcceptanceGate from "./TermsAcceptanceGate";

vi.mock("@/lib/legal-terms", () => ({ getTermsStatus: vi.fn(), getCurrentTerms: vi.fn(), acceptCurrentTerms: vi.fn() }));
vi.mock("@/i18n/routing", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));

function gate(locale: "es" | "en") {
  return <NextIntlClientProvider locale={locale} messages={locale === "es" ? es : en} timeZone="America/Santiago"><TermsAcceptanceGate><p>Protected content</p></TermsAcceptanceGate></NextIntlClientProvider>;
}

describe("TermsAcceptanceGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(terms.getTermsStatus).mockResolvedValue({ accepted: false, currentVersion: "1", acceptedAt: null });
    vi.mocked(terms.getCurrentTerms).mockImplementation(async (locale) => ({ locale: locale === "en" ? "en" : "es", version: "1", title: "Terms document", notice: "Notice", contentHash: "test-hash", sections: [] }));
  });

  it("requires an explicit checkbox action before submitting acceptance", async () => {
    render(gate("es"));
    const checkbox = await screen.findByRole<HTMLInputElement>("checkbox");
    expect(checkbox.checked).toBe(false);
    const accept = screen.getByRole<HTMLButtonElement>("button", { name: es.TermsAcceptance.accept });
    expect(accept.disabled).toBe(true);
    fireEvent.click(checkbox);
    expect(accept.disabled).toBe(false);
    expect(terms.acceptCurrentTerms).not.toHaveBeenCalled();
  });

  it("requires confirmation again when loading terms for another language", async () => {
    const { rerender } = render(gate("es"));
    fireEvent.click(await screen.findByRole("checkbox"));
    rerender(gate("en"));
    await waitFor(() => expect(terms.getCurrentTerms).toHaveBeenCalledWith("en"));
    const checkbox = await screen.findByRole<HTMLInputElement>("checkbox");
    expect(checkbox.checked).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: en.TermsAcceptance.accept }).disabled).toBe(true);
  });
});
