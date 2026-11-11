import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EssentialStorageNotice from "./EssentialStorageNotice";
import { IntlProvider } from "@/test/render";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const KEY = "marsys_essential_storage_notice_dismissed";

function renderNotice() {
  return render(
    <IntlProvider>
      <EssentialStorageNotice />
    </IntlProvider>,
  );
}

describe("EssentialStorageNotice", () => {
  beforeEach(() => localStorage.clear());

  it("does not render on the server", () => {
    const html = renderToString(
      <IntlProvider>
        <EssentialStorageNotice />
      </IntlProvider>,
    );

    expect(html).toBe("");
  });

  it("explains essential storage without requesting consent for trackers", () => {
    renderNotice();

    expect(screen.getByRole("complementary")).toBeDefined();
    expect(screen.getByRole("link", { name: "Política de Privacidad" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Entendido" })).toBeDefined();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("remembers when the notice is dismissed", () => {
    renderNotice();
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));

    expect(localStorage.getItem(KEY)).toBe("1");
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("does not show again after dismissal", () => {
    localStorage.setItem(KEY, "1");
    renderNotice();

    expect(screen.queryByRole("complementary")).toBeNull();
  });
});
