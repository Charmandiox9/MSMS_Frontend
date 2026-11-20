import { render, screen } from "@testing-library/react";
import { CircleHelp } from "lucide-react";
import { describe, expect, it } from "vitest";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it.each(["neutral", "info", "warning", "success", "danger"] as const)(
    "communicates the %s status with text and a decorative icon",
    (tone) => {
      const { container } = render(
        <StatusBadge label="Recorded status" icon={CircleHelp} tone={tone} />,
      );
      expect(screen.getByText("Recorded status")).toBeDefined();
      expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    },
  );
});
