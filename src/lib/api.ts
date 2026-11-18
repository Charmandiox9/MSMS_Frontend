import { resolveApiBaseUrl } from './runtime-config';
import { ApiError, formatApiErrorMessage } from './api-error';

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  const apiUrl = await resolveApiBaseUrl();
  if (!apiUrl) throw new Error('API URL no configurada');

  const headers = new Headers(init?.headers);
  if (typeof FormData !== 'undefined' && init?.body instanceof FormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new ApiError(formatApiErrorMessage(payload), response.status);
  }

  return response;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApi(path, init);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export async function apiFetchFile(path: string, contentType: string): Promise<Blob> {
  const response = await requestApi(path, { cache: 'no-store' });
  if (response.headers.get('content-type')?.split(';', 1)[0] !== contentType)
    throw new Error('La respuesta no contiene el archivo solicitado');
  return response.blob();
}
