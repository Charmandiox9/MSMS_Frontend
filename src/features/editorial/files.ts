import { apiFetch } from "@/lib/api";
import { resolveApiBaseUrl } from "@/lib/runtime-config";
import { roleHeaders } from "./presentation";
import type {
  EditorialFileKind,
  EditorialFileView,
  EditorialLanguage,
} from "./schema-types";

export type FileInput = {
  entryId: string;
  kind: EditorialFileKind;
  language: EditorialLanguage;
  fileName: string;
  videoId?: string;
};
export type Reservation = {
  id: string;
  uploadUrl: string;
  maxBytes: number;
  mime: string;
};

async function absoluteEditorialUrl(path: string) {
  const base = await resolveApiBaseUrl();
  if (!base || !path.startsWith("/api/editorial/files/"))
    throw new Error("EDITORIAL_URL_INVALID");
  return new URL(`${base}${path.slice("/api".length)}`, window.location.origin)
    .href;
}

export async function editorialFileUrl(
  id: string,
  preview: boolean,
  role?: string | null,
) {
  const value = await apiFetch<{ url: string }>(
    `/editorial/files/${id}/access`,
    {
      method: "POST",
      headers: roleHeaders(role),
      body: JSON.stringify({ preview }),
    },
  );
  return absoluteEditorialUrl(value.url);
}

export function reserveEditorialFile(input: FileInput, role: string) {
  return apiFetch<Reservation>("/editorial/files", {
    method: "POST",
    headers: roleHeaders(role),
    body: JSON.stringify(input),
  });
}

export async function transferEditorialFile(
  reservation: Reservation,
  file: File,
  role: string,
  progress: (percent: number) => void,
) {
  const url = await absoluteEditorialUrl(reservation.uploadUrl);
  return new Promise<EditorialFileView>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        xhr.response?.status === "READY"
      )
        resolve(xhr.response as EditorialFileView);
      else reject(new Error("EDITORIAL_UPLOAD_FAILED"));
    });
    xhr.addEventListener("error", () =>
      reject(new Error("EDITORIAL_UPLOAD_FAILED")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("EDITORIAL_UPLOAD_FAILED")),
    );
    xhr.open("PUT", url);
    xhr.responseType = "json";
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", reservation.mime);
    xhr.setRequestHeader("X-Marsys-Active-Role", role);
    xhr.send(file);
  });
}
