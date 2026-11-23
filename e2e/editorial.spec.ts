import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  EditorialDraftInput,
  EditorialFileView,
  EditorialFilters,
  EditorialKind,
  EditorialManagedEntry,
  EditorialRevisionView,
} from "../src/features/editorial/schema-types";
import { expect, loginAs, test } from "./support";

const fixtures = resolve("e2e/fixtures/editorial");
const manualName = "manual-historial-ayudantias.pdf";
const videoName = "capsula-historial-ayudantias.mp4";
const captionsName = "historial-ayudantias-es.vtt";
const guideTitle = "Consultar el historial de ayudantías de un estudiante";
const newsTitle = "Consulta las ayudantías anteriores desde Estudiantes";
const date = "2026-11-22T12:00:00.000Z";
const origin = "http://localhost:3100";
const supportRole = "TEACHING_SUPPORT_COORDINATOR";
const cors = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "POST, PUT, GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-marsys-active-role, range",
};

function graphRevision(revision: EditorialRevisionView | null) {
  return (
    revision && {
      ...revision,
      __typename: "EditorialRevisionView",
      files: revision.files.map((file) => ({
        ...file,
        __typename: "EditorialFileView",
      })),
    }
  );
}

function graphEntry(entry: EditorialManagedEntry, managed = true) {
  return {
    ...entry,
    __typename: managed ? "EditorialManagedEntry" : "EditorialPublication",
    draft: graphRevision(entry.draft),
    published: graphRevision(entry.published),
  };
}

test("Administration previews a restricted guide and readers gain access when they switch to its audience", async ({
  context,
  page,
  browser,
}) => {
  const entries = new Map<string, EditorialManagedEntry>();
  let interruptedUploadId: string | undefined;
  let retriedUpload = false;
  let failNextList = true;
  const assets = new Map<
    string,
    { file: EditorialFileView; binary?: Buffer; mime: string }
  >();
  const fixtureRoute = async (target: typeof context) => {
    await target.route("**/api/graphql", async (route) => {
      const request = route.request();
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      const { operationName, variables } = request.postDataJSON() as {
        operationName: string;
        variables?: {
          kind?: EditorialKind;
          id?: string;
          input?: EditorialDraftInput;
          filters?: EditorialFilters;
          featured?: boolean;
        };
      };
      const reply = (data: unknown) =>
        route.fulfill({ headers: cors, json: { data } });
      const published = [...entries.values()].filter(
        (entry) => entry.status === "PUBLISHED",
      );
      const role = request.headers()["x-marsys-active-role"];
      const visible = published.filter(
        (entry) =>
          !entry.published?.roleCodes.length ||
          entry.published.roleCodes.includes(role),
      );
      const readerEntry = (entry: EditorialManagedEntry) =>
        graphEntry(
          {
            ...entry,
            published: entry.published && {
              ...entry.published,
              guideId: visible.some(
                (guide) => guide.id === entry.published?.guideId,
              )
                ? entry.published.guideId
                : null,
            },
          },
          false,
        );
      const filters = variables?.filters;
      if (operationName === "EditorialPublications") {
        if (failNextList) {
          failNextList = false;
          return route.fulfill({ status: 503, headers: cors, json: {} });
        }
        const items = visible.filter(
          (entry) =>
            (!filters?.kind || filters.kind === entry.kind) &&
            (!filters?.topic || filters.topic === entry.published?.topic) &&
            (!filters?.search ||
              entry.published?.titleEs
                .toLowerCase()
                .includes(filters.search.toLowerCase())) &&
            (!filters?.format ||
              entry.published?.files.some(
                (file) => file.kind === filters.format,
              )),
        );
        return reply({
          editorialPublications: {
            __typename: "EditorialPage",
            items: items.map(readerEntry),
            total: items.length,
          },
        });
      }
      if (operationName === "EditorialFeatured") {
        const featured = visible.find((entry) => entry.featured);
        return reply({
          editorialFeaturedPublication: featured ? readerEntry(featured) : null,
        });
      }
      if (operationName === "EditorialPublication") {
        const item = visible.find((entry) => entry.id === variables?.id);
        return item
          ? reply({ editorialPublication: readerEntry(item) })
          : route.fulfill({
              headers: cors,
              json: {
                data: null,
                errors: [
                  {
                    message: "Publicación no disponible",
                    extensions: { originalError: { statusCode: 404 } },
                  },
                ],
              },
            });
      }
      if (!/Editorial/.test(operationName)) return route.fallback();

      expect(request.headers()["x-marsys-active-role"]).toBe("SYSTEM_ADMIN");
      if (operationName === "EditorialRoles")
        return reply({
          editorialRoleOptions: [
            { code: "SYSTEM_ADMIN", name: "Administrador del sistema" },
            { code: supportRole, name: "Apoyo docente" },
          ],
        });
      const id = variables?.input?.id ?? variables?.id;
      const entry = id ? entries.get(id) : undefined;
      if (operationName === "EditorialManaged") {
        const matches = (
          filters?.publishedOnly ? published : [...entries.values()]
        ).filter((entry) => !filters?.kind || filters.kind === entry.kind);
        return reply({
          editorialManagedEntries: {
            __typename: "EditorialManagedPage",
            items: matches.map((entry) => graphEntry(entry)),
            total: matches.length,
          },
        });
      }
      if (operationName === "CreateEditorial") {
        const item: EditorialManagedEntry = {
          id: randomUUID(),
          kind: variables?.kind ?? "NEWS",
          status: "DRAFT",
          version: 1,
          draft: null,
          published: null,
          publishedAt: null,
          firstPublishedAt: null,
          updatedAt: date,
          featured: false,
        };
        entries.set(item.id, item);
        return reply({ createEditorialEntry: graphEntry(item) });
      }
      if (!entry)
        throw new Error(`Unknown editorial entry ${id} in ${operationName}`);
      if (operationName === "EditorialEntry")
        return reply({ editorialManagedEntry: graphEntry(entry) });
      const input = variables?.input;
      expect(input?.version).toBe(entry.version);
      entry.version++;
      if (operationName === "SaveEditorial" && input) {
        entry.draft = {
          number: entry.version,
          topic: input.topic ?? null,
          titleEs: input.titleEs,
          summaryEs: input.summaryEs,
          bodyEs: input.bodyEs,
          roleCodes: input.roleCodes ?? [],
          titleEn: input.titleEn ?? null,
          summaryEn: input.summaryEn ?? null,
          bodyEn: input.bodyEn ?? null,
          destination: input.destination ?? null,
          guideId: input.guideId ?? null,
          files: input.fileIds.map((fileId) => assets.get(fileId)!.file),
        };
        return reply({ saveEditorialDraft: graphEntry(entry) });
      }
      if (operationName === "PublishEditorial") {
        entry.published = entry.draft;
        entry.draft = null;
        entry.firstPublishedAt ??= date;
        entry.publishedAt = date;
        entry.status = "PUBLISHED";
        return reply({ publishEditorialEntry: graphEntry(entry) });
      }
      if (operationName === "HighlightEditorial") {
        entry.featured = !!variables?.featured;
        return reply({ setEditorialFeatured: graphEntry(entry) });
      }
      if (operationName === "ArchiveEditorial") {
        entry.status = "ARCHIVED";
        entry.featured = false;
        return reply({ archiveEditorialEntry: graphEntry(entry) });
      }
      throw new Error(`Unexpected GraphQL operation ${operationName}`);
    });

    await target.route("**/api/editorial/files**", async (route) => {
      const request = route.request();
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      const { pathname } = new URL(request.url());
      const [, , , , id, action] = pathname.split("/");
      if (!id) {
        expect(request.headers()["x-marsys-active-role"]).toBe("SYSTEM_ADMIN");
        const { kind, language, fileName, videoId } =
          request.postDataJSON() as Pick<
            EditorialFileView,
            "kind" | "language" | "fileName" | "videoId"
          >;
        const file = {
          id: randomUUID(),
          kind,
          language,
          fileName,
          videoId: videoId ?? null,
          status: "PENDING",
          size: null,
          duration: null,
        } satisfies EditorialFileView;
        const mime = {
          PDF: "application/pdf",
          VIDEO: "video/mp4",
          CAPTIONS: "text/vtt",
        }[kind];
        assets.set(file.id, { file, mime });
        return route.fulfill({
          headers: cors,
          json: {
            id: file.id,
            mime,
            maxBytes: 52_428_800,
            uploadUrl: `/api/editorial/files/${file.id}/upload`,
          },
        });
      }
      const asset = assets.get(id);
      if (!asset) return route.fulfill({ status: 404, headers: cors });
      if (action === "upload") {
        expect(request.headers()["content-type"]).toBe(asset.mime);
        if (!interruptedUploadId) {
          interruptedUploadId = id;
          return route.abort("connectionreset");
        }
        if (id === interruptedUploadId) retriedUpload = true;
        const fixture = await readFile(resolve(fixtures, asset.file.fileName));
        const uploaded = request.postDataBuffer();
        if (uploaded?.length) expect(uploaded.equals(fixture)).toBe(true);
        // Chromium omits file-backed request bodies from Playwright route inspection.
        asset.binary = uploaded?.length ? uploaded : fixture;
        asset.file = {
          ...asset.file,
          status: "READY",
          size: asset.binary?.length ?? 0,
        };
        return route.fulfill({ headers: cors, json: asset.file });
      }
      if (action === "access")
        return route.fulfill({
          headers: cors,
          json: { url: `/api/editorial/files/${id}/content?token=test` },
        });
      const binary = asset.binary ?? Buffer.alloc(0);
      if (asset.file.kind === "PDF")
        return route.fulfill({
          contentType: asset.mime,
          headers: {
            ...cors,
            "Content-Disposition": `attachment; filename="${asset.file.fileName}"`,
          },
          body: binary,
        });
      const range = request.headers().range?.match(/^bytes=(\d+)-(\d*)$/);
      if (asset.file.kind === "VIDEO" && range) {
        const start = Number(range[1]);
        const end = Math.min(
          range[2] ? Number(range[2]) : binary.length - 1,
          binary.length - 1,
        );
        return route.fulfill({
          status: 206,
          contentType: asset.mime,
          headers: {
            ...cors,
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes ${start}-${end}/${binary.length}`,
          },
          body: binary.subarray(start, end + 1),
        });
      }
      return route.fulfill({
        contentType: asset.mime,
        headers: cors,
        body: binary,
      });
    });
  };

  await fixtureRoute(context);
  await loginAs(context, "admin");
  await page.goto("/dashboard/updates");
  await expect(
    page.getByRole("alert").getByText("No pudimos cargar el contenido."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reintentar" }).press("Enter");
  await expect(
    page.getByText("Todavía no se han publicado novedades."),
  ).toBeVisible();
  await page.goto("/dashboard/editorial");
  await page.getByRole("button", { name: "Nueva guía" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar guía" }),
  ).toBeVisible();
  const editSpanish = page.getByRole("group", { name: "Español", exact: true });
  await editSpanish.getByLabel("Título").fill(guideTitle);
  await editSpanish
    .getByLabel("Resumen")
    .fill(
      "Ubica las asignaturas y los semestres de las ayudantías anteriores.",
    );
  await editSpanish
    .getByLabel("Contenido")
    .fill(
      "1. Abre **Estudiantes**.\n2. Busca a Alex Demo.\n3. Abre Historial de ayudantías.",
    );
  await page.getByRole("combobox", { name: "Módulo" }).selectOption("STUDENTS");
  await page
    .getByRole("combobox", { name: "Enlace a una pantalla" })
    .selectOption("STUDENTS");
  await page.getByRole("radio", { name: "Roles específicos" }).check();
  await page.getByRole("checkbox", { name: "Apoyo docente" }).check();

  for (const [kind, name] of [
    ["PDF", manualName],
    ["VIDEO", videoName],
    ["CAPTIONS", captionsName],
  ]) {
    await page
      .getByRole("combobox", { name: "Tipo de archivo" })
      .selectOption(kind);
    if (kind === "CAPTIONS")
      await page
        .getByRole("combobox", { name: "Cápsula de estos subtítulos" })
        .selectOption({ label: videoName });
    await page
      .locator("input[type=file]")
      .setInputFiles(resolve(fixtures, name));
    await page.getByRole("button", { name: "Subir archivo" }).click();
    if (kind === "PDF") {
      await page.getByRole("button", { name: "Reintentar" }).click();
    }
    await expect(
      page.getByRole("button", { name: `Reemplazar ${name}` }),
    ).toBeVisible();
  }
  expect(retriedUpload).toBe(true);

  await page.getByRole("button", { name: "Vista previa" }).click();
  await expect(
    page.getByText(
      "Esta publicación no está disponible para el rol seleccionado.",
    ),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Ver como" })
    .selectOption(supportRole);
  await expect(page.getByRole("heading", { name: guideTitle })).toBeVisible();
  await page.getByRole("button", { name: "Volver a editar" }).click();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Publicada", { exact: true })).toBeVisible();
  const guide = [...entries.values()][0];
  const initialManual = guide.published?.files.find(
    (file) => file.kind === "PDF",
  )?.id;
  expect(initialManual).toBeDefined();
  await page.getByRole("button", { name: `Reemplazar ${manualName}` }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles(resolve(fixtures, manualName));
  await page.getByRole("button", { name: "Subir archivo" }).click();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(
    page.getByRole("button", { name: "Publicar", exact: true }),
  ).toBeEnabled();
  expect(guide.published?.files.find((file) => file.kind === "PDF")?.id).toBe(
    initialManual,
  );
  expect(guide.draft?.files.find((file) => file.kind === "PDF")?.id).not.toBe(
    initialManual,
  );
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Publicada", { exact: true })).toBeVisible();

  await page
    .getByRole("link", { name: "Volver a la gestión editorial" })
    .click();
  await page.getByRole("button", { name: "Nueva novedad" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar novedad" }),
  ).toBeVisible();
  await editSpanish.getByLabel("Título").fill(newsTitle);
  await editSpanish
    .getByLabel("Resumen")
    .fill("Revisa el historial de una persona desde Estudiantes.");
  await editSpanish
    .getByLabel("Contenido")
    .fill("Abre **Estudiantes** y despliega el historial debajo del registro.");
  await page.getByRole("combobox", { name: "Módulo" }).selectOption("STUDENTS");
  await page
    .getByRole("combobox", { name: "Guía relacionada" })
    .selectOption(guide.id);
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();

  const reader = await browser.newContext({
    viewport: { width: 1100, height: 844 },
    colorScheme: "dark",
    locale: "es-CL",
    timezoneId: "America/Santiago",
  });
  try {
    await reader.addInitScript(() =>
      localStorage.setItem("marsys_essential_storage_notice_dismissed", "1"),
    );
    await fixtureRoute(reader);
    await loginAs(reader, "multi");
    const view = await reader.newPage();
    await view.goto(`${origin}/dashboard/updates/guides/${guide.id}`);
    await expect(
      view.getByText("Esta publicación ya no está disponible."),
    ).toBeVisible();
    await view.goto(`${origin}/dashboard/updates`);
    await view.getByRole("link", { name: newsTitle }).click();
    await expect(view.getByRole("heading", { name: newsTitle })).toBeVisible();
    await expect(
      view.getByRole("link", { name: "Guía relacionada" }),
    ).toHaveCount(0);
    await view.getByRole("button", { name: "Mi cuenta" }).click();
    await view
      .getByRole("button", {
        name: "Cambiar rol. Rol actual: Administrador del sistema",
      })
      .click();
    await view
      .getByRole("region", { name: "Roles disponibles" })
      .getByRole("button", { name: "Apoyo docente" })
      .click();
    await view
      .getByRole("region", { name: "Confirmar cambio de rol" })
      .getByRole("button", { name: "Cambiar rol", exact: true })
      .click();
    await view.setViewportSize({ width: 390, height: 844 });
    await view.getByRole("link", { name: "Guía relacionada" }).click();
    await expect(view.getByRole("heading", { name: guideTitle })).toBeVisible();
    const download = view.waitForEvent("download");
    await view
      .getByRole("button", { name: `Descargar ${manualName} (Español)` })
      .click();
    expect((await download).suggestedFilename()).toBe(manualName);
    await expect(view.locator("video")).toHaveCount(0);
    await view
      .getByRole("button", { name: "Abrir reproductor" })
      .press("Enter");
    await expect(view.locator("video track")).toHaveAttribute("srclang", "es");
    await expect
      .poll(() =>
        view
          .locator("video")
          .evaluate((node: HTMLVideoElement) => node.readyState),
      )
      .toBeGreaterThan(0);
    await view.locator("video").evaluate(async (video: HTMLVideoElement) => {
      video.muted = true;
      video.currentTime = 15;
      await video.play();
    });
    await expect
      .poll(() =>
        view
          .locator("video")
          .evaluate((video: HTMLVideoElement) => video.currentTime),
      )
      .toBeGreaterThan(15);
    await expect
      .poll(() =>
        view
          .locator("video")
          .evaluate(
            (node: HTMLVideoElement) => node.textTracks[0]?.cues?.length ?? 0,
          ),
      )
      .toBeGreaterThan(0);

    await reader.addCookies([
      { name: "MARSYS_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    await view.goto(`${origin}/dashboard/updates?tab=guides&topic=STUDENTS`);
    await expect(
      view.getByRole("heading", { name: "Updates and guides" }),
    ).toBeVisible();
    await view.getByRole("combobox", { name: "Format" }).selectOption("VIDEO");
    await view
      .getByRole("searchbox", { name: "Search by title or summary" })
      .fill("sin resultados esperados");
    await expect(
      view.getByText("No content matches these filters."),
    ).toBeVisible();
    await view
      .getByRole("searchbox", { name: "Search by title or summary" })
      .clear();
    await view.getByRole("link", { name: guideTitle }).click();
    await expect(view.getByText("Content available in Spanish.")).toBeVisible();
    await page.goto(`/dashboard/editorial/${guide.id}`);
    await page.getByRole("button", { name: "Archivar", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar archivo" }).click();
    await expect(page.getByText("Archivada", { exact: true })).toBeVisible();
    await view.reload();
    await expect(
      view.getByText("This publication is no longer available."),
    ).toBeVisible();
  } finally {
    await reader.close();
  }
});
