"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from '@react-three/fiber';
import { useTheme } from "next-themes";
import * as THREE from "three";

function ParticleSquidSwarm() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  const squidCount = 3500;
  const squidScale = 1.5;
  const wakeCount = 700;
  const roamingCount = 300;
  const planktonCount = 1200; 
  const totalCount = squidCount + wakeCount + roamingCount + planktonCount;
  
  const particles = useMemo(() => {
    const temp = [];
    
    // 1. PARTICULAS QUE FORMAN EL CALAMAR
    for (let i = 0; i < squidCount; i++) {
      let x = 0, y = 0, z = 0;
      let colorLight = "";
      let colorDark = "";
      const rand = Math.random();
      
      if (rand < 0.45) {
        // Manto
        x = Math.random() * 5; 
        let maxRadius = 0;
        if (x < 1.5) maxRadius = (1 - Math.pow((x - 1.5)/1.5, 2)) * 1.2;
        else maxRadius = (1 - Math.pow((x - 1.5)/3.5, 2)) * 1.2;
        
        const angle = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * maxRadius; 
        
        y = Math.sin(angle) * r;
        z = Math.cos(angle) * r;
        
        colorLight = Math.random() > 0.2 ? "#0ea5e9" : "#1e3a8a"; 
        colorDark = Math.random() > 0.2 ? "#0ea5e9" : "#38bdf8";
      } else if (rand < 0.6) {
        // Aletas
        x = 3 + Math.random() * 2;
        const finWidth = (x - 3) * 1.5; 
        y = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * finWidth);
        z = (Math.random() - 0.5) * 0.4;
        
        colorLight = "#0284c7"; colorDark = "#38bdf8";
      } else if (rand < 0.65) {
        // Ojos
        x = 0.5 + (Math.random() - 0.5) * 0.4;
        const side = Math.random() > 0.5 ? 1 : -1;
        y = (Math.random() - 0.5) * 0.4;
        z = side * 1.0 + (Math.random() - 0.5) * 0.3;
        
        colorLight = "#0f172a"; colorDark = "#ffffff";
      } else if (rand < 0.85) {
        // 8 Brazos
        x = -Math.random() * 3;
        const armIdx = Math.floor(Math.random() * 8); 
        const angle = (armIdx / 8) * Math.PI * 2;
        const spread = 0.8 + (-x * 0.2); 
        
        const baseY = Math.sin(angle) * spread;
        const baseZ = Math.cos(angle) * spread;
        
        const thick = (1 - Math.abs(x)/3) * 0.2;
        y = baseY + (Math.random() - 0.5) * thick;
        z = baseZ + (Math.random() - 0.5) * thick;
        
        colorLight = Math.random() > 0.8 ? "#f59e0b" : "#1e3a8a"; 
        colorDark = Math.random() > 0.8 ? "#f59e0b" : "#38bdf8";
      } else {
        // 2 Tentáculos largos (Acortados)
        x = -Math.random() * 4.5;
        const side = Math.random() > 0.5 ? 1 : -1;
        const spread = 1.2 + (-x * 0.15);
        
        let thick = 0.1;
        if (x < -3.5) thick = 0.4; // Mazas al final ajustadas a la nueva longitud
        
        y = -0.5 + (Math.random() - 0.5) * thick;
        z = side * spread + (Math.random() - 0.5) * thick;
        
        colorLight = Math.random() > 0.8 ? "#f59e0b" : "#0ea5e9"; 
        colorDark = Math.random() > 0.8 ? "#fcd34d" : "#7dd3fc";
      }
      
      temp.push({ 
        type: 'squid',
        baseX: x, baseY: y, baseZ: z, 
        t: Math.random() * 100, 
        speed: 0.001 + Math.random() * 0.004, // Movimiento más lento
        colorLight, colorDark,
        mx: 0, my: 0
      });
    }
    
    // 2. WAKE
    for (let i = 0; i < wakeCount; i++) {
      temp.push({
        type: 'wake',
        baseX: 3 + Math.random() * 12, 
        baseY: (Math.random() - 0.5) * 1.5,
        baseZ: (Math.random() - 0.5) * 1.5,
        t: Math.random() * 100,
        speed: 0.01 + Math.random() * 0.015, // Movimiento más lento
        colorLight: Math.random() > 0.5 ? "#0ea5e9" : "#f59e0b",
        colorDark: Math.random() > 0.5 ? "#38bdf8" : "#fcd34d",
        mx: 0, my: 0
      });
    }

    // 3. PARTICULAS EXPLORADORAS
    for (let i = 0; i < roamingCount; i++) {
      temp.push({
        type: 'roaming',
        baseX: (Math.random() - 0.5) * 20,
        baseY: (Math.random() - 0.5) * 20,
        baseZ: (Math.random() - 0.5) * 10,
        t: Math.random() * 100,
        speed: 0.005 + Math.random() * 0.01, // Movimiento más lento
        colorLight: Math.random() > 0.8 ? "#f59e0b" : "#0ea5e9",
        colorDark: Math.random() > 0.8 ? "#fcd34d" : "#38bdf8",
        mx: 0, my: 0
      });
    }

    // 4. PLANCTON AMBIENTAL
    for (let i = 0; i < planktonCount; i++) {
      const isMagenta = Math.random() > 0.5;
      temp.push({
        type: 'plankton',
        baseX: (Math.random() - 0.5) * 35, 
        baseY: (Math.random() - 0.5) * 25, 
        baseZ: -4 - Math.random() * 12, 
        t: Math.random() * 100,
        speed: 0.002 + Math.random() * 0.005, // Movimiento más lento
        colorLight: isMagenta ? "#ec4899" : "#10b981", 
        colorDark: isMagenta ? "#f472b6" : "#34d399",
        mx: 0, my: 0
      });
    }
    
    return temp;
  }, []);

  useEffect(() => {
    if (mesh.current) {
      particles.forEach((p, i) => {
        mesh.current!.setColorAt(i, new THREE.Color(isDark ? p.colorDark : p.colorLight));
      });
      mesh.current.instanceColor!.needsUpdate = true;
    }
  }, [particles, isDark]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.getElapsedTime();
    const globalBob = Math.sin(time * 0.8) * 0.5;
    
    const targetX = mouse.current.x * 12;
    const targetY = mouse.current.y * 12;
    
    particles.forEach((particle, i) => {
      particle.t += particle.speed;
      
      if (particle.type === 'squid') {
        const isTentacle = particle.baseX < 0;
        const waveY = isTentacle ? Math.sin(time * 1.5 + particle.baseX * 2) * 0.4 : 0;
        
        // Centrado general del calamar sin seguimiento al mouse (escalado con squidScale)
        dummy.position.set(
          (particle.baseX - 1) * squidScale,
          (particle.baseY + waveY) * squidScale,
          particle.baseZ * squidScale
        );
        
        const s = (0.2 + Math.sin(particle.t * 2) * 0.08) * squidScale;
        dummy.scale.set(s, s, s);
        
      } else if (particle.type === 'wake') {
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
          particle.baseZ * spread
        );
        
        const s = 0.15;
        dummy.scale.set(s, s, s);

      } else if (particle.type === 'plankton') {
        particle.baseY += particle.speed * 0.5;
        if (particle.baseY > 15) particle.baseY = -15; 
        
        const driftX = Math.sin(particle.t) * 1.5;
        const driftZ = Math.cos(particle.t * 0.8) * 1.5;
        
        dummy.position.set(
          particle.baseX + driftX + (mouse.current.x * 0.5),
          particle.baseY + (mouse.current.y * 0.5),
          particle.baseZ + driftZ
        );
        
        const s = 0.08 + Math.sin(particle.t) * 0.03;
        dummy.scale.set(s, s, s);

      } else {
        const localTargetX = targetX * Math.cos(-Math.PI / 6) - targetY * Math.sin(-Math.PI / 6);
        const localTargetY = targetX * Math.sin(-Math.PI / 6) + targetY * Math.cos(-Math.PI / 6);

        particle.mx += (localTargetX - particle.mx) * 0.03;
        particle.my += (localTargetY - particle.my) * 0.03;
        
        const orbitX = Math.sin(particle.t * 2) * 1.5;
        const orbitY = Math.cos(particle.t * 2.5) * 1.5;
        
        dummy.position.set(
          particle.mx + orbitX,
          particle.my + orbitY,
          particle.baseZ
        );
        
        const s = 0.15;
        dummy.scale.set(s, s, s);
      }
      
      dummy.rotation.x = particle.t;
      dummy.rotation.y = particle.t * 1.5;
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    
    // Flote global: desplaza la figura bajo el bloque de bienvenida.
    mesh.current!.position.y = globalBob - 1;
    mesh.current!.position.x = 3.5;

    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, totalCount]} rotation={[0, Math.PI / 12, Math.PI / 6]}>
      <tetrahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial 
        color="white"
        transparent 
        opacity={isDark ? 0.9 : 0.7} 
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ParticleSquidSwarm />
      </Canvas>
    </div>
  );
}
