"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import { useTheme } from "next-themes";

function ParticleField(props: any) {
  const ref = useRef<any>();
  const { theme, systemTheme } = useTheme();
  
  // Generate random points in a sphere
  const sphere = random.inSphere(new Float32Array(3000), { radius: 1.5 });
  
  // Determine color based on theme
  const currentTheme = theme === "system" ? systemTheme : theme;
  const color = currentTheme === "dark" ? "#3b82f6" : "#1e3a8a";

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color={color}
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-50 dark:opacity-30">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleField />
      </Canvas>
    </div>
  );
}
