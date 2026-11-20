import { expect, test } from "@playwright/test";

const record = {
  id: "11111111-1111-4111-8111-111111111111",
  studentId: "22222222-2222-4222-8222-222222222222",
  reference: "TIT-2026-11111111",
  studentName: "Alumno Ficticio",
  studentRut: "11111111-2",
  studentEmail: null,
  studentPhone: null,
  careerId: "33333333-3333-4333-8333-333333333333",
  careerName: "Biología Marina",
  thesisTopic: "Tema de tesis ficticio",
  guideName: "Docente Ficticio",
  coGuideName: null,
  reviewerOneName: "Revisor Ficticio",
  reviewerTwoName: null,
  degree: null,
  defenseDate: null,
  stage: "UNCLASSIFIED",
  outcome: "GRADUATED",
  source: "LEGACY_ACCESS",
  defenseAnnexesStatus: "UNVERIFIED",
  thesisSummaryStatus: "UNVERIFIED",
  libraryFormStatus: "UNVERIFIED",
  actaStatus: "UNVERIFIED",
  evaluationsStatus: "UNVERIFIED",
  createdAt: "2026-11-18T12:00:00.000Z",
  updatedAt: "2026-11-18T12:00:00.000Z",
  documentDrafts: ["thesis-summary"],
  student: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Alumno Ficticio",
    email: null,
    rut: "11111111-2",
  },
};

for (const locale of ["es", "en"] as const) {
  for (const mode of ["desktop-light", "mobile-dark"] as const) {
    test(`${locale} ${mode}: graduates keep their missing information and link to their academic record`, async ({
      page,
      context,
      baseURL,
    }, testInfo) => {
      const origin = new URL("/", baseURL).origin;
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await context.addInitScript((dark) => {
        localStorage.setItem("theme", dark ? "dark" : "light");
          localStorage.setItem("marsys_essential_storage_notice_dismissed", "1");
        localStorage.setItem(
          "marsys_cookie_consent",
          JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
          }),
        );
      }, mode === "mobile-dark");
      await page.setViewportSize(
        mode === "mobile-dark"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
      );
      await context.addCookies([
        { name: "MARSYS_LOCALE", value: locale, url: origin },
      ]);
      await page.route("**/api/**", async (route) => {
        const headers = {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };
        if (route.request().method() === "OPTIONS") {
          await route.fulfill({ status: 204, headers });
          return;
        }
        const path = new URL(route.request().url()).pathname;
        let body: unknown;
        if (path.endsWith("/runtime-config"))
          body = { graphqlUrl: "http://localhost:3999/api/graphql" };
        else if (path.endsWith("/auth/session"))
          body = { email: "staff@example.com", roles: ["ACADEMIC_SECRETARY"] };
        else if (path.includes("terms"))
          body = { accepted: true, required: false };
        else if (path.endsWith("/titulations/filters"))
          body = {
            periods: [],
            careers: [{ id: record.careerId, name: record.careerName }],
            hasUndated: true,
            counts: { ALL: 1, REVIEW: 1, ACTIVE: 0, GRADUATED: 1 },
          };
        else if (path.endsWith("/titulations/search")) {
          const filters = route.request().postDataJSON() as { view?: string };
          body = {
            items: filters.view === "ACTIVE" ? [] : [record],
            page: 1,
            pageSize: 10,
            total: filters.view === "ACTIVE" ? 0 : 1,
            totalPages: 1,
          };
        } else if (path.endsWith("/attachments")) body = [];
        else if (path.endsWith(`/titulations/${record.id}`)) body = record;
        else body = {};
        await route.fulfill({ json: body, headers });
      });
      await page.goto("/dashboard/titulation");
      await expect(page).toHaveURL(/\/dashboard\/titulation(?:\?.*)?$/);
      const graduates = page.getByRole("button", {
        name: locale === "es" ? /^Titulados/ : /^Graduates/,
      });
      await graduates.click();
      await expect(graduates).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(/view=GRADUATED/);
      await expect(
        page
          .locator("li")
          .getByText(
              locale === "es" ? "Sin fecha registrada" : "No defense date recorded",
          )
          .first(),
      ).toBeVisible();
      const academicLink = page.getByRole("link", {
        name:
          locale === "es"
            ? "Consultar trayectoria académica"
            : "View academic history",
      });
      await expect(academicLink).toHaveAttribute(
        "href",
        new RegExp(`${record.studentId}/progress$`),
      );
      await graduates.focus();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", {
          name: locale === "es" ? /^Todos/ : /^All records/,
        }),
      ).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(await page.locator("h1").count()).toBe(1);
      const unlabelledControls = await page
        .locator("select, input:not([type=hidden])")
        .evaluateAll(
          (controls) =>
            controls.filter(
              (control) =>
                !(control as HTMLInputElement).labels?.length &&
                !control.getAttribute("aria-label"),
            ).length,
        );
      expect(unlabelledControls).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${mode}.png`),
        fullPage: true,
      });
      expect(pageErrors).toEqual([]);
    });
  }
}
