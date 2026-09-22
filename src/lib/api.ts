const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (configuredApiUrl?.replace(/\/graphql$/, '') ?? 'http://localhost:3001/api').replace(/\/$/, '');

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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
