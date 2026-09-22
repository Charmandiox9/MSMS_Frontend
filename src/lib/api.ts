import { resolveApiBaseUrl } from './runtime-config';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = await resolveApiBaseUrl();
  if (!apiUrl) throw new Error('API URL no configurada');

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'No se pudo completar la solicitud');
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
