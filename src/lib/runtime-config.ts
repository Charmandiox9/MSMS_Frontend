type RuntimeConfig = {
  graphqlUrl?: string | null;
};

const buildTimeGraphqlUrl = process.env.NEXT_PUBLIC_API_URL;
let runtimeGraphqlUrlPromise: Promise<string | undefined> | undefined;

const normalizeGraphqlUrl = (url: string | undefined | null) =>
  url?.replace(/\/graphql\/?$/, '');

export async function resolveApiBaseUrl(): Promise<string | undefined> {
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

export function getBuildTimeAuthBaseUrl(): string | undefined {
  return normalizeGraphqlUrl(buildTimeGraphqlUrl);
}
