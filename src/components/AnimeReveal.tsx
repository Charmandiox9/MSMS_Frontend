"use client";

import { useEffect, useRef, ReactNode } from "react";
import anime from "animejs";

interface AnimeRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  className?: string;
  stagger?: boolean;
}

export default function AnimeReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  duration = 800,
  className = "",
  stagger = false,
}: AnimeRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const getTranslate = () => {
      switch (direction) {
        case "up": return { translateY: [distance, 0] };
        case "down": return { translateY: [-distance, 0] };
        case "left": return { translateX: [distance, 0] };
        case "right": return { translateX: [-distance, 0] };
        default: return { translateY: [distance, 0] };
      }
    };

    const targets = stagger 
      ? containerRef.current.children 
      : containerRef.current;

    if (stagger) {
      containerRef.current.style.opacity = "1";
      // Ensure children start invisible so they don't flash
      Array.from(containerRef.current.children).forEach((child: any) => {
        child.style.opacity = "0";
      });
    }

    anime({
      targets,
      opacity: [0, 1],
      ...getTranslate(),
      duration,
      delay: stagger ? anime.stagger(100, { start: delay }) : delay,
      easing: "easeOutExpo",
    });
  }, [direction, distance, duration, delay, stagger]);

  return (
    <div ref={containerRef} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
