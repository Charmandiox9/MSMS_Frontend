import { test as base, expect, type BrowserContext } from '@playwright/test';
import { BACKEND_URL } from '../playwright.config';

export type Account = 'admin' | 'secretary' | 'coordinator' | 'analyst' | 'multi';

/** Inicia sesión dejando la cookie que emite el backend tras el login con Google. */
export async function loginAs(context: BrowserContext, account: Account) {
  await context.addCookies([
    { name: 'token', value: account, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  ]);
}

export async function backendState() {
  const response = await fetch(`${BACKEND_URL}/__state`);
  return (await response.json()) as {
    inbox: { id: string }[];
    justifications: { id: string; status: string; reasonCategory?: string; rejectionReason?: string | null }[];
    users: { id: string; roles: { code: string }[] }[];
    decisions: Record<string, unknown>[];
  };
}

const COOKIE_CONSENT = JSON.stringify({ necessary: true, analytics: false, marketing: false });

export const test = base.extend<{ resetBackend: void }>({
  // El banner de cookies cubre la parte baja de la pantalla; se da por aceptado.
  context: async ({ context }, use) => {
    await context.addInitScript((consent) => localStorage.setItem('marsys_cookie_consent', consent), COOKIE_CONSENT);
    await use(context);
  },
  resetBackend: [
    async ({}, use) => {
      await fetch(`${BACKEND_URL}/__reset`, { method: 'POST' });
      await use();
    },
    { auto: true },
  ],
});

export { expect };
