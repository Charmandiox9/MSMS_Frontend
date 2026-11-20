"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

const PARTICLE_COUNTS = {
  squid: 3000,
  wake: 280,
  roaming: 100,
  plankton: 370,
} as const;

const TOTAL_PARTICLES = Object.values(PARTICLE_COUNTS).reduce(
  (total, count) => total + count,
  0,
);

type ParticleType = keyof typeof PARTICLE_COUNTS;
type PaletteToken =
  | "--illustration-primary"
  | "--illustration-secondary"
  | "--illustration-fin"
  | "--illustration-accent"
  | "--illustration-highlight"
  | "--illustration-tentacle"
  | "--illustration-current"
  | "--illustration-ink"
  | "--illustration-plankton-a"
  | "--illustration-plankton-b";

type Particle = {
  type: ParticleType;
  baseX: number;
  baseY: number;
  baseZ: number;
  t: number;
  speed: number;
  colorToken: PaletteToken;
  mx: number;
  my: number;
};

function createParticles(): Particle[] {
  const particles: Particle[] = [];

  for (let index = 0; index < PARTICLE_COUNTS.squid; index += 1) {
    let x = 0;
    let y = 0;
    let z = 0;
    let colorToken: PaletteToken;
    const region = Math.random();

    if (region < 0.45) {
      x = Math.random() * 5;
      const maxRadius =
        x < 1.5
          ? (1 - ((x - 1.5) / 1.5) ** 2) * 1.2
          : (1 - ((x - 1.5) / 3.5) ** 2) * 1.2;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * maxRadius;
      y = Math.sin(angle) * radius;
      z = Math.cos(angle) * radius;
      colorToken = Math.random() > 0.2 ? "--illustration-primary" : "--illustration-secondary";
    } else if (region < 0.6) {
      x = 3 + Math.random() * 2;
      const finWidth = (x - 3) * 1.5;
      y = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * finWidth);
      z = (Math.random() - 0.5) * 0.4;
      colorToken = "--illustration-fin";
    } else if (region < 0.65) {
      x = 0.5 + (Math.random() - 0.5) * 0.4;
      const side = Math.random() > 0.5 ? 1 : -1;
      y = (Math.random() - 0.5) * 0.4;
      z = side + (Math.random() - 0.5) * 0.3;
      colorToken = "--illustration-ink";
    } else if (region < 0.85) {
      x = -Math.random() * 3;
      const armIndex = Math.floor(Math.random() * 8);
      const angle = (armIndex / 8) * Math.PI * 2;
      const spread = 0.8 + -x * 0.2;
      const thickness = (1 - Math.abs(x) / 3) * 0.2;
      y = Math.sin(angle) * spread + (Math.random() - 0.5) * thickness;
      z = Math.cos(angle) * spread + (Math.random() - 0.5) * thickness;
      colorToken = Math.random() > 0.8 ? "--illustration-accent" : "--illustration-secondary";
    } else {
      x = -Math.random() * 4.5;
      const side = Math.random() > 0.5 ? 1 : -1;
      const spread = 1.2 + -x * 0.15;
      const thickness = x < -3.5 ? 0.4 : 0.1;
      y = -0.5 + (Math.random() - 0.5) * thickness;
      z = side * spread + (Math.random() - 0.5) * thickness;
      colorToken = Math.random() > 0.8 ? "--illustration-highlight" : "--illustration-tentacle";
    }

    particles.push({
      type: "squid",
      baseX: x,
      baseY: y,
      baseZ: z,
      t: Math.random() * 100,
      speed: 0.001 + Math.random() * 0.004,
      colorToken,
      mx: 0,
      my: 0,
    });
  }

  for (let index = 0; index < PARTICLE_COUNTS.wake; index += 1) {
    particles.push({
      type: "wake",
      baseX: 3 + Math.random() * 12,
      baseY: (Math.random() - 0.5) * 1.5,
      baseZ: (Math.random() - 0.5) * 1.5,
      t: Math.random() * 100,
      speed: 0.01 + Math.random() * 0.015,
      colorToken: Math.random() > 0.5 ? "--illustration-current" : "--illustration-highlight",
      mx: 0,
      my: 0,
    });
  }

  for (let index = 0; index < PARTICLE_COUNTS.roaming; index += 1) {
    particles.push({
      type: "roaming",
      baseX: (Math.random() - 0.5) * 20,
      baseY: (Math.random() - 0.5) * 20,
      baseZ: (Math.random() - 0.5) * 10,
      t: Math.random() * 100,
      speed: 0.005 + Math.random() * 0.01,
      colorToken: Math.random() > 0.8 ? "--illustration-highlight" : "--illustration-current",
      mx: 0,
      my: 0,
    });
  }

  for (let index = 0; index < PARTICLE_COUNTS.plankton; index += 1) {
    particles.push({
      type: "plankton",
      baseX: (Math.random() - 0.5) * 35,
      baseY: (Math.random() - 0.5) * 25,
      baseZ: -4 - Math.random() * 12,
      t: Math.random() * 100,
      speed: 0.002 + Math.random() * 0.005,
      colorToken: Math.random() > 0.5 ? "--illustration-plankton-a" : "--illustration-plankton-b",
      mx: 0,
      my: 0,
    });
  }

  return particles;
}

function ParticleSquidSwarm() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const mouse = useRef({ x: 0, y: 0 });
  const squidScale = 1.5;
  const particles = useMemo(() => createParticles(), []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const currentMesh = mesh.current;
    if (!currentMesh) return;

    const paletteElement =
      document.querySelector<HTMLElement>('[data-illustration-palette="login"]') ??
      document.querySelector<HTMLElement>(".institutional-theme") ??
      document.documentElement;
    const palette = getComputedStyle(paletteElement);
    const colors = new Map<string, THREE.Color>();

    particles.forEach((particle, index) => {
      const value = palette.getPropertyValue(particle.colorToken).trim();
      let color = colors.get(value);
      if (!color) {
        color = new THREE.Color(value);
        colors.set(value, color);
      }
      currentMesh.setColorAt(index, color);
    });

    if (currentMesh.instanceColor) currentMesh.instanceColor.needsUpdate = true;
  }, [particles, isDark]);

  useFrame((state) => {
    const currentMesh = mesh.current;
    if (!currentMesh) return;

    const time = state.clock.getElapsedTime();
    const targetX = mouse.current.x * 12;
    const targetY = mouse.current.y * 12;
    const rotationAngle = -Math.PI / 6;
    const localTargetX =
      targetX * Math.cos(rotationAngle) - targetY * Math.sin(rotationAngle);
    const localTargetY =
      targetX * Math.sin(rotationAngle) + targetY * Math.cos(rotationAngle);

    particles.forEach((particle, index) => {
      particle.t += particle.speed;

      if (particle.type === "squid") {
        const isTentacle = particle.baseX < 0;
        const waveY = isTentacle
          ? Math.sin(time * 1.5 + particle.baseX * 2) * 0.4
          : 0;
        dummy.position.set(
          (particle.baseX - 1) * squidScale,
          (particle.baseY + waveY) * squidScale,
          particle.baseZ * squidScale,
        );
        const scale = (0.2 + Math.sin(particle.t * 2) * 0.08) * squidScale;
        dummy.scale.setScalar(scale);
      } else if (particle.type === "wake") {
        particle.baseX -= particle.speed * 2;
        if (particle.baseX < -15) {
          particle.baseX = 2 + Math.random() * 2;
          particle.baseY = (Math.random() - 0.5) * 1.5;
          particle.baseZ = (Math.random() - 0.5) * 1.5;
        }
        const spread = 1 + (2 - particle.baseX) * 0.3;
        dummy.position.set(
          particle.baseX,
          particle.baseY * spread,
          particle.baseZ * spread,
        );
        dummy.scale.setScalar(0.15);
      } else if (particle.type === "plankton") {
        particle.baseY += particle.speed * 0.5;
        if (particle.baseY > 15) particle.baseY = -15;
        dummy.position.set(
          particle.baseX + Math.sin(particle.t) * 1.5 + mouse.current.x * 0.5,
          particle.baseY + mouse.current.y * 0.5,
          particle.baseZ + Math.cos(particle.t * 0.8) * 1.5,
        );
        dummy.scale.setScalar(0.08 + Math.sin(particle.t) * 0.03);
      } else {
        particle.mx += (localTargetX - particle.mx) * 0.03;
        particle.my += (localTargetY - particle.my) * 0.03;
        dummy.position.set(
          particle.mx + Math.sin(particle.t * 2) * 1.5,
          particle.my + Math.cos(particle.t * 2.5) * 1.5,
          particle.baseZ,
        );
        dummy.scale.setScalar(0.15);
      }

      dummy.rotation.set(particle.t, particle.t * 1.5, 0);
      dummy.updateMatrix();
      currentMesh.setMatrixAt(index, dummy.matrix);
    });

    currentMesh.position.y = Math.sin(time * 0.8) * 0.5 - 1;
    currentMesh.position.x = 3.5;
    currentMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, TOTAL_PARTICLES]}
      rotation={[0, Math.PI / 12, Math.PI / 6]}
    >
      <tetrahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial
        transparent
        opacity={isDark ? 0.9 : 0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setIsReducedMotion(motionPreference.matches);
    const updatePageVisibility = () => setIsPageVisible(document.visibilityState === "visible");

    updateMotionPreference();
    updatePageVisibility();
    motionPreference.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updatePageVisibility);

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => setIsVisible(entry.isIntersecting),
        { rootMargin: "128px" },
      );
      observer.observe(container);

      return () => {
        observer.disconnect();
        motionPreference.removeEventListener("change", updateMotionPreference);
        document.removeEventListener("visibilitychange", updatePageVisibility);
      };
    }

    return () => {
      motionPreference.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);

  const shouldRenderCanvas = isVisible && !isReducedMotion;

  return (
    <div ref={containerRef} aria-hidden="true" className="absolute inset-0 size-full">
      {shouldRenderCanvas && (
        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          dpr={[1, 1.25]}
          frameloop={isPageVisible ? "always" : "never"}
          gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        >
          <ParticleSquidSwarm />
        </Canvas>
      )}
    </div>
  );
}
