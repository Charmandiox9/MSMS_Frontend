import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import anime from "animejs";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { mockMatchMedia } from "@/test/setup";

vi.mock("animejs", () => {
  const stagger = vi.fn(
    (step: number, opts?: { start?: number }) => opts?.start ?? step
  );
  const animeMock = Object.assign(vi.fn(), { stagger });
  return { default: animeMock };
});

const mockAnime = vi.mocked(anime);

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
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
  mockMatchMedia(() => false);
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
});

describe("ScrollReveal", () => {
  it("renderiza sus children", () => {
    const { getByText } = render(
      <ScrollReveal>
        <p>Contenido</p>
      </ScrollReveal>
    );
    expect(getByText("Contenido")).toBeDefined();
  });

  it("oculta el contenido hasta que entra en el viewport", () => {
    const { container } = render(
      <ScrollReveal>
        <p>Hola</p>
      </ScrollReveal>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("0");
    expect(mockAnime).not.toHaveBeenCalled();
  });

  it("anima con easeOutExpo al intersectar", () => {
    render(
      <ScrollReveal>
        <p>Hola</p>
      </ScrollReveal>
    );
    const [io] = MockIntersectionObserver.instances;
    expect(io.observe).toHaveBeenCalledTimes(1);

    io.trigger();
    expect(mockAnime).toHaveBeenCalledTimes(1);

    const call = mockAnime.mock.calls[0][0];
    expect(call.easing).toBe("easeOutExpo");
    expect(call.duration).toBe(900);
  });

  it("solo reproduce la animación una vez", () => {
    render(
      <ScrollReveal>
        <p>Hola</p>
      </ScrollReveal>
    );
    const [io] = MockIntersectionObserver.instances;
    io.trigger();
    io.trigger();
    expect(mockAnime).toHaveBeenCalledTimes(1);
  });

  it("aplica stagger a los children", () => {
    render(
      <ScrollReveal stagger>
        <p>A</p>
        <p>B</p>
      </ScrollReveal>
    );
    const [io] = MockIntersectionObserver.instances;
    io.trigger();

    expect(mockAnime).toHaveBeenCalledTimes(1);
    const call = mockAnime.mock.calls[0][0];
    expect(Array.isArray(call.targets)).toBe(true);
    expect((call.targets as Element[]).length).toBe(2);
    expect(mockAnime.stagger).toHaveBeenCalled();
  });

  it("respeta prefers-reduced-motion y no anima", () => {
    mockMatchMedia((query) => query === "(prefers-reduced-motion: reduce)");
    const { container } = render(
      <ScrollReveal>
        <p>Hola</p>
      </ScrollReveal>
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe("1");
    expect(mockAnime).not.toHaveBeenCalled();
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
