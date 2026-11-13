'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor, View } from '@react-three/drei';
import { useState } from 'react';
import * as THREE from 'three';
import { completeTask, ui } from '@/lib/store';
import { stepBakes } from './bakeQueue';

/** Clears the whole canvas once per frame; Views (index ≥ 2) then draw into their scissored rects. */
function Clearer() {
  useFrame(({ gl }) => {
    stepBakes(gl, 1);
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
  }, 1);
  return null;
}

/** The single WebGL context for the whole site. Sections render into it through drei <View>. */
export default function Stage() {
  const tier = ui.get().tier;
  const native = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  // never render above the display's own density; weaker tiers cap lower
  const max = Math.min(native, tier === 'high' ? 2 : tier === 'mid' ? 1.5 : 1.25);
  const [dpr, setDpr] = useState(max);
  return (
    <Canvas
      className="gl-canvas"
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      dpr={dpr}
      gl={{ alpha: true, antialias: tier !== 'low', powerPreference: 'high-performance', premultipliedAlpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.autoClear = false;
        (window as unknown as { __gl: unknown }).__gl = gl;
        completeTask('gl');
      }}
      aria-hidden
    >
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => setDpr((d) => Math.max(0.75, +(d * 0.8).toFixed(2)))}
        onIncline={() => setDpr((d) => Math.min(max, +(d * 1.1).toFixed(2)))}
      />
      <Clearer />
      <View.Port />
    </Canvas>
  );
}
