"use client";

import { useEffect, useRef, type ReactNode } from "react";
import anime from 'animejs';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  stagger?: number | boolean;
  className?: string;
  threshold?: number;
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 900,
  distance = 32,
  direction = "up",
  stagger = 0,
  className = "",
  threshold = 0.15,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  const staggerMs = typeof stagger === "number" ? stagger : stagger ? 90 : 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Accessibility: respect the user's motion preference (cross-fade, no travel)
    if (getReducedMotion()) {
      container.style.opacity = "1";
      Array.from(container.children).forEach((child) => {
        (child as HTMLElement).style.opacity = "1";
      });
      return;
    }

    const targets: Element[] =
      staggerMs > 0 ? Array.from(container.children) : [container];

    targets.forEach((target) => {
      (target as HTMLElement).style.opacity = "0";
    });

    const getTranslate = () => {
      switch (direction) {
        case "up":
          return { translateY: [distance, 0] };
        case "down":
          return { translateY: [-distance, 0] };
        case "left":
          return { translateX: [distance, 0] };
        case "right":
          return { translateX: [-distance, 0] };
        default:
          return { translateY: [distance, 0] };
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || playedRef.current) return;
          playedRef.current = true;
          observer.disconnect();

          anime({
            targets,
            opacity: [0, 1],
            ...getTranslate(),
            duration,
            easing: "easeOutExpo",
            delay: staggerMs > 0 ? anime.stagger(staggerMs, { start: delay }) : delay,
          });
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [delay, duration, distance, direction, staggerMs, threshold]);

  return (
    <div
      ref={containerRef}
      className={`${className} ${staggerMs > 0 ? "[&>*]:opacity-0" : ""}`.trim()}
      style={{ opacity: staggerMs > 0 ? undefined : 0 }}
    >
      {children}
    </div>
  );
}
