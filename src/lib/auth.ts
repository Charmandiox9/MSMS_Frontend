const graphqlUrl = process.env.NEXT_PUBLIC_API_URL;
const authBaseUrl = graphqlUrl?.replace(/\/graphql$/, '');

const authEndpoint = (path: string) =>
  authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;

export const googleLoginUrl = authEndpoint('google');

export type ActiveSession = {
  email: string;
  roles: string[];
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const sessionUrl = authEndpoint('session');
  if (!sessionUrl) return null;

  const response = await fetch(sessionUrl, { credentials: 'include' });
  if (!response.ok) return null;
  return response.json() as Promise<ActiveSession>;
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
