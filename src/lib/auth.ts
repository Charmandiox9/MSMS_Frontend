import { getBuildTimeAuthBaseUrl, resolveApiBaseUrl } from "./runtime-config";
import type { ActiveSession } from "@/types/auth";
export type { ActiveSession } from "@/types/auth";

const authEndpoint = (path: string) => {
  const authBaseUrl = getBuildTimeAuthBaseUrl();
  return authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;
};

const SESSION_CHECK_TIMEOUT_MS = 10_000;
const LOGOUT_TIMEOUT_MS = 4_000;

export const DASHBOARD_WELCOME_PENDING_STORAGE_KEY =
  'marsys_dashboard_welcome_pending';

export const googleLoginUrl = authEndpoint("google");

export async function getActiveSession(): Promise<ActiveSession | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SESSION_CHECK_TIMEOUT_MS,
  );

  try {
    const authBaseUrl = await resolveApiBaseUrl();
    const sessionUrl = authBaseUrl ? `${authBaseUrl}/auth/session` : undefined;
    if (!sessionUrl) return null;

    const response = await fetch(sessionUrl, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      !("email" in payload) ||
      typeof payload.email !== "string" ||
      !payload.email.trim() ||
      !("roles" in payload) ||
      !Array.isArray(payload.roles) ||
      !payload.roles.every((role: unknown) => typeof role === "string")
    )
      return null;
    if (
      "avatarUrl" in payload &&
      payload.avatarUrl !== undefined &&
      typeof payload.avatarUrl !== "string"
    )
      return null;
    if (
      "displayName" in payload &&
      typeof payload.displayName !== "string"
    )
      return null;
    const displayName =
      "displayName" in payload && typeof payload.displayName === "string"
        ? payload.displayName.trim()
        : "";
    return {
      email: payload.email,
      roles: payload.roles,
      ...(displayName ? { displayName } : {}),
      ...("avatarUrl" in payload && typeof payload.avatarUrl === "string"
        ? { avatarUrl: payload.avatarUrl }
        : {}),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOGOUT_TIMEOUT_MS);
  try {
    const response = await fetch(logoutUrl, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Logout request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}
