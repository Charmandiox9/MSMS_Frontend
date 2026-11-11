"use client";
import { useLayoutEffect, useRef, useState } from "react";

export default function AccountDialTooltip({
  id,
  label,
  anchor,
}: {
  id: string;
  label: string;
  anchor: DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useLayoutEffect(() => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const margin = 12;
    const gap = 10;
    const leftSpace = anchor.left - gap - margin;
    const rightSpace = window.innerWidth - anchor.right - gap - margin;
    let left: number;
    let top: number;
    if (bounds.width <= leftSpace) {
      left = anchor.left - bounds.width - gap;
      top = anchor.top + (anchor.height - bounds.height) / 2;
    } else if (bounds.width <= rightSpace) {
      left = anchor.right + gap;
      top = anchor.top + (anchor.height - bounds.height) / 2;
    } else {
      left = anchor.left + (anchor.width - bounds.width) / 2;
      top = anchor.top - bounds.height - gap;
    }
    setPosition({
      left: Math.max(
        margin,
        Math.min(left, window.innerWidth - bounds.width - margin),
      ),
      top: Math.max(
        margin,
        Math.min(top, window.innerHeight - bounds.height - margin),
      ),
    });
  }, [anchor, label]);
  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      className="pointer-events-none fixed z-10 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover px-3 py-2 text-xs font-semibold leading-5 text-popover-foreground shadow-lg"
      style={{
        left: position?.left ?? 12,
        top: position?.top ?? 12,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {label}
    </div>
  );
}
