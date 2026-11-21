export function resolveAuthCallbackTarget(route?: string): string {
  if (
    route === "/dashboard" ||
    route?.startsWith("/dashboard/") ||
    route === "/no-access"
  )
    return route;

  return "/";
}
