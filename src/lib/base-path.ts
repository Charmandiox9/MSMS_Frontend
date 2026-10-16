export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

if (!/^(?:\/[a-zA-Z0-9_-]+)*$/.test(APP_BASE_PATH)) {
  throw new Error('NEXT_PUBLIC_BASE_PATH debe ser un prefijo como /fasol/marsys');
}

/** Next Link/router add basePath themselves; use this only for raw URLs/fetch. */
export function withBasePath(path: string): string {
  if (!APP_BASE_PATH || !path.startsWith('/') || path.startsWith('//') ||
      path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) return path;
  return `${APP_BASE_PATH}${path}`;
}
