import { getBuildTimeAuthBaseUrl, resolveApiBaseUrl } from './runtime-config';

const authEndpoint = (path: string) => {
  const authBaseUrl = getBuildTimeAuthBaseUrl();
  return authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;
};

export const googleLoginUrl = authEndpoint('google');

export type ActiveSession = {
  email: string;
  roles: string[];
  avatarUrl?: string;
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const authBaseUrl = await resolveApiBaseUrl();
  const sessionUrl = authBaseUrl ? `${authBaseUrl}/auth/session` : undefined;
  if (!sessionUrl) return null;

  try {
    const response = await fetch(sessionUrl, { credentials: 'include' });
    if (!response.ok) return null;
    return (await response.json()) as ActiveSession;
  } catch {
    return null;
  }
}

export async function hasActiveSession(): Promise<boolean> {
  return (await getActiveSession()) !== null;
}

export async function logout(): Promise<void> {
  const authBaseUrl = await resolveApiBaseUrl();
  const logoutUrl = authBaseUrl ? `${authBaseUrl}/auth/logout` : undefined;
  if (!logoutUrl) {
    return;
  }

  await fetch(logoutUrl, {
    method: 'POST',
    credentials: 'include',
  });
}
