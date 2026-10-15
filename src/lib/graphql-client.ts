import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { resolveApiBaseUrl } from './runtime-config';

export function createApiGraphqlClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: '/api/graphql', credentials: 'include',
      fetch: async (_uri, options) => {
        const base = await resolveApiBaseUrl();
        if (!base) throw new Error('API_NOT_CONFIGURED');
        return fetch(`${base}/graphql`, options);
      },
    }),
  });
}
