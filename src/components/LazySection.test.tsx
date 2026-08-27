import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import LazySection from "@/components/LazySection";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  readonly initOptions: IntersectionObserverInit | undefined;

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.initOptions = options;
    MockIntersectionObserver.instances.push(this);
  }

  trigger(entry: Partial<IntersectionObserverEntry> = {}): void {
    const full: IntersectionObserverEntry = {
      boundingClientRect: new DOMRect(0, 0, 100, 100),
      intersectionRatio: 1,
      intersectionRect: new DOMRect(0, 0, 100, 100),
      isIntersecting: true,
      rootBounds: null,
      target: document.body,
      time: Date.now(),
      ...entry,
    };
    this.callback([full], this);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  MockIntersectionObserver.instances.length = 0;
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
});

describe("LazySection", () => {
  it("no genera el contenido hasta acercarse al viewport", () => {
    const { queryByText } = render(
      <LazySection>
        <p>Contenido perezoso</p>
      </LazySection>
    );
    expect(queryByText("Contenido perezoso")).toBeNull();
  });

  it("genera el contenido al acercarse al viewport", () => {
    const { queryByText } = render(
      <LazySection>
        <p>Contenido perezoso</p>
      </LazySection>
    );
    const [io] = MockIntersectionObserver.instances;
    expect(io.observe).toHaveBeenCalledTimes(1);

    act(() => {
      io.trigger();
    });
    expect(queryByText("Contenido perezoso")).not.toBeNull();
  });

  it("usa el preMargin configurado en el observer", () => {
    render(
      <LazySection preMargin={500}>
        <p>X</p>
      </LazySection>
    );
    const [io] = MockIntersectionObserver.instances;
    expect(io.initOptions?.rootMargin).toBe("500px 0px");
  });

  it("solo genera el contenido una vez", () => {
    const { queryByText } = render(
      <LazySection>
        <p>Contenido perezoso</p>
      </LazySection>
    );
    const [io] = MockIntersectionObserver.instances;
    act(() => {
      io.trigger();
      io.trigger();
    });
    expect(queryByText("Contenido perezoso")).not.toBeNull();
    expect(io.disconnect).toHaveBeenCalled();
  });

  it("genera el contenido de inmediato si IntersectionObserver no existe", () => {
    const Original = window.IntersectionObserver;
    Object.defineProperty(window, "IntersectionObserver", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { queryByText } = render(
      <LazySection>
        <p>Fallback</p>
      </LazySection>
    );
    expect(queryByText("Fallback")).not.toBeNull();

    Object.defineProperty(window, "IntersectionObserver", {
      value: Original,
      configurable: true,
      writable: true,
    });
  });
});
