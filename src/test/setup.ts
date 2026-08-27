import { vi } from "vitest";

export interface MediaQueryListMock {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
}

export function createMediaQueryListMock(matches: boolean, media: string): MediaQueryListMock {
  return {
    matches,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

export function mockMatchMedia(handler: (query: string) => boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => createMediaQueryListMock(handler(query), query)),
  });
}

// Sin movimiento reducido por defecto
mockMatchMedia(() => false);
