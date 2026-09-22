const graphqlUrl = process.env.NEXT_PUBLIC_API_URL;
const authBaseUrl = graphqlUrl?.replace(/\/graphql$/, '');

const authEndpoint = (path: string) =>
  authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;

export const googleLoginUrl = authEndpoint('google');

export type ActiveSession = {
  email: string;
  roles: string[];
  avatarUrl?: string;
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const sessionUrl = authEndpoint('session');
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
  const logoutUrl = authEndpoint('logout');
  if (!logoutUrl) {
    return;
  }

  await fetch(logoutUrl, {
    method: 'POST',
    credentials: 'include',
  });
}
