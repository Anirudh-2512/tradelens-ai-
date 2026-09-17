"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ── Abstract candlestick terrain ───────────────────────────── */

function CandleField({ count = 42 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);

  const candles = useMemo(() => {
    const items: Array<{
      position: [number, number, number];
      height: number;
      width: number;
      positive: boolean;
      speed: number;
    }> = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * 18;
      const z = (rand() - 0.5) * 12 - 2;
      const h = 0.6 + rand() * 2.4;
      items.push({
        position: [x, 0, z],
        height: h,
        width: 0.28 + rand() * 0.2,
        positive: rand() > 0.45,
        speed: 0.3 + rand() * 0.6,
      });
    }
    return items;
  }, [count]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.12;
  });

  return (
    <group ref={group} position={[0, -2.2, 0]}>
      {candles.map((c, i) => (
        <Float
          key={i}
          speed={c.speed}
          rotationIntensity={0.2}
          floatIntensity={c.speed * 0.5}
        >
          <mesh
            position={[c.position[0], c.height / 2 + 0.4, c.position[2]]}
            castShadow={false}
          >
            <boxGeometry args={[c.width, c.height, c.width]} />
            <meshStandardMaterial
              color={c.positive ? "#1c5c38" : "#5c1c1c"}
              emissive={c.positive ? "#22C55E" : "#EF4444"}
              emissiveIntensity={0.35}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ── Particles ──────────────────────────────────────────────── */

function MarketParticles({ count = 800 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <group ref={ref}>
      <Points positions={positions} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color="#D4AF37"
          size={0.045}
          sizeAttenuation
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

/* ── Canvas ─────────────────────────────────────────────────── */

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 9], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} color="#F4D76E" />
      <pointLight position={[-6, 2, -4]} intensity={10} color="#D4AF37" distance={16} />

      <CandleField />
      <MarketParticles />

      <fog attach="fog" args={["#050505", 9, 20]} />
    </Canvas>
  );
}
