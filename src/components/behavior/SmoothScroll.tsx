"use client";

import { ReactLenis } from "lenis/react";
import 'lenis/dist/lenis.css';

export default function SmoothScroll() {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        respectReducedMotion: true,
      }}
    />
  );
}
