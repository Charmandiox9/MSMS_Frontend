import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("lenis/react", () => ({
  ReactLenis: vi.fn(() => null),
}));

import { ReactLenis } from "lenis/react";
import SmoothScroll from "@/components/behavior/SmoothScroll";

describe("SmoothScroll", () => {
  it("monta ReactLenis en root con respeto al reduced-motion", () => {
    render(<SmoothScroll />);

    expect(ReactLenis).toHaveBeenCalledTimes(1);
    const props = vi.mocked(ReactLenis).mock.calls[0][0];
    expect(props.root).toBe(true);
    expect(props.options).toEqual(
      expect.objectContaining({ respectReducedMotion: true })
    );
  });
});
