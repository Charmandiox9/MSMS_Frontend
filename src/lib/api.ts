import { resolveApiBaseUrl } from './runtime-config';
import { formatApiErrorMessage } from './api-error';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = await resolveApiBaseUrl();
  if (!apiUrl) throw new Error('API URL no configurada');

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(formatApiErrorMessage(payload));
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
