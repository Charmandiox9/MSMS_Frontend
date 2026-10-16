import { getBuildTimeAuthBaseUrl, resolveApiBaseUrl } from "./runtime-config";
import type { ActiveSession } from "@/types/auth";
export type { ActiveSession } from "@/types/auth";

const authEndpoint = (path: string) => {
  const authBaseUrl = getBuildTimeAuthBaseUrl();
  return authBaseUrl ? `${authBaseUrl}/auth/${path}` : undefined;
};

export const googleLoginUrl = authEndpoint("google");

export async function getActiveSession(): Promise<ActiveSession | null> {
  const authBaseUrl = await resolveApiBaseUrl();
  const sessionUrl = authBaseUrl ? `${authBaseUrl}/auth/session` : undefined;
  if (!sessionUrl) return null;

  try {
    const response = await fetch(sessionUrl, { credentials: "include" });
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
    return {
      email: payload.email,
      roles: payload.roles,
      ...("avatarUrl" in payload && typeof payload.avatarUrl === "string"
        ? { avatarUrl: payload.avatarUrl }
        : {}),
    };
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
    method: "POST",
    credentials: "include",
  });
}
