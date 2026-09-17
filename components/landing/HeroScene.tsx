"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const HeroCanvas = lazy(() => import("./HeroCanvas"));

/**
 * Client wrapper: dynamically imports the R3F canvas so three.js
 * never ships in the main bundle. Falls back to a static gradient
 * when 3D is unavailable (reduced motion, low-power devices).
 */
export function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [enable3d, setEnable3d] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Graceful degradation for low-power devices / small screens:
    // fewer effects on mobile (spec §36).
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const lowMem = (navigator as { deviceMemory?: number }).deviceMemory
      ? (navigator as { deviceMemory?: number }).deviceMemory! <= 2
      : false;
    setEnable3d(!lowMem);
    void mobile;
  }, []);

  if (!mounted || reducedMotion || !enable3d) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 tl-grid-bg"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />
    );
  }

  return (
    <div aria-hidden className="absolute inset-0">
      <Suspense
        fallback={
          <div className="absolute inset-0 tl-grid-bg opacity-60" />
        }
      >
        <HeroCanvas />
      </Suspense>
    </div>
  );
}
