type RuntimeConfig = {
  graphqlUrl?: string;
};

const buildTimeGraphqlUrl = process.env.NEXT_PUBLIC_API_URL;
let runtimeGraphqlUrlPromise: Promise<string | undefined> | undefined;

const normalizeGraphqlUrl = (url: string | undefined) =>
  url?.replace(/\/graphql\/?$/, '');

async function resolveAuthBaseUrl(): Promise<string | undefined> {
  const buildTimeBaseUrl = normalizeGraphqlUrl(buildTimeGraphqlUrl);
  if (typeof window === 'undefined') return buildTimeBaseUrl;

  runtimeGraphqlUrlPromise ??= fetch('/api/runtime-config', {
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) return undefined;
      const config = (await response.json()) as RuntimeConfig;
      return normalizeGraphqlUrl(config.graphqlUrl);
    })
    .catch(() => undefined);

  return (await runtimeGraphqlUrlPromise) ?? buildTimeBaseUrl;
}

const authEndpoint = (path: string) => {
  const authBaseUrl = normalizeGraphqlUrl(buildTimeGraphqlUrl);
  return authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;
};

export const googleLoginUrl = authEndpoint('google');

export type ActiveSession = {
  email: string;
  roles: string[];
  avatarUrl?: string;
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const authBaseUrl = await resolveAuthBaseUrl();
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
  const authBaseUrl = await resolveAuthBaseUrl();
  const logoutUrl = authBaseUrl ? `${authBaseUrl}/auth/logout` : undefined;
  if (!logoutUrl) {
    return;
  }

  await fetch(logoutUrl, {
    method: 'POST',
    credentials: 'include',
  });
}
