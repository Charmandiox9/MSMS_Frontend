import { withBasePath } from './base-path';

type RuntimeConfig = {
  graphqlUrl?: string | null;
};

const buildTimeGraphqlUrl = process.env.NEXT_PUBLIC_API_URL;
const RUNTIME_CONFIG_TIMEOUT_MS = 4_000;
let runtimeGraphqlUrlPromise: Promise<string | undefined> | undefined;

const normalizeGraphqlUrl = (url: string | undefined | null) =>
  url ? withBasePath(url.replace(/\/graphql\/?$/, '')) : undefined;

export async function resolveApiBaseUrl(): Promise<string | undefined> {
  const buildTimeBaseUrl = normalizeGraphqlUrl(buildTimeGraphqlUrl);
  if (typeof window === 'undefined') return buildTimeBaseUrl;

  runtimeGraphqlUrlPromise ??= (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      RUNTIME_CONFIG_TIMEOUT_MS,
    );

    try {
      const response = await fetch(withBasePath('/api/runtime-config'), {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return undefined;
      const config = (await response.json()) as RuntimeConfig;
      return normalizeGraphqlUrl(config.graphqlUrl);
    } catch {
      return undefined;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  return (await runtimeGraphqlUrlPromise) ?? buildTimeBaseUrl;
}

export function getBuildTimeAuthBaseUrl(): string | undefined {
  return normalizeGraphqlUrl(buildTimeGraphqlUrl);
}
