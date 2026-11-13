'use client';
import { PerspectiveCamera, View } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Planet, type PlanetHandle } from '../planet/Planet';
import { Sky, makeSunMaterial } from '../Sky';
import { completeTask, frame, ui } from '@/lib/store';

const SUN = new THREE.Vector3(0.34, 0.035, -1).normalize();
// camera shots: limb at dawn → wide gibbous view with the moon
const A = { p: new THREE.Vector3(-1.5, 10.95, 15.5), t: new THREE.Vector3(3.5, 9.55, -40), fov: 34 };
const B = { p: new THREE.Vector3(30, 7, 22), t: new THREE.Vector3(-1.5, 0.6, 0), fov: 36 };

const ease = (x: number) => x * x * (3 - 2 * x);
const damp = (c: number, t: number, r: number, dt: number) => c + (t - c) * (1 - Math.exp(-r * dt));

function HeroContent() {
  const cam = useRef<THREE.PerspectiveCamera>(null!);
  const planet = useRef<PlanetHandle>(null);
  const moon = useRef<PlanetHandle>(null);
  const sun = useRef<THREE.Mesh>(null!);
  const s = useRef({ prog: 0, px: 0, py: 0, intro: 0 });
  const sunMat = useMemo(() => makeSunMaterial(0xfff1d6, 1.15, 0.55), []);
  const tier = ui.get().tier;
  const reduced = ui.get().reduced;
  const parts = useRef(0);
  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpT = useMemo(() => new THREE.Vector3(), []);

  const onReady = useCallback(() => {
    planet.current?.setSun(SUN);
    moon.current?.setSun(SUN);
    if (++parts.current === 3) requestAnimationFrame(() => requestAnimationFrame(() => completeTask('hero')));
  }, []);

  useEffect(() => () => sunMat.dispose(), [sunMat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = s.current;
    // intro dolly after the loader: from slightly closer/lower to shot A
    const loaded = ui.get().loaded;
    st.intro = reduced ? 1 : loaded ? Math.min(1, st.intro + dt / 3.2) : 0;
    const intro = 1 - Math.pow(1 - st.intro, 3);
    st.prog = reduced ? frame.hero : damp(st.prog, frame.hero, 5, dt);
    st.px = damp(st.px, reduced ? 0 : frame.pointerX, 2.2, dt);
    st.py = damp(st.py, reduced ? 0 : frame.pointerY, 2.2, dt);
    const k = ease(Math.min(1, Math.max(0, st.prog)));

    const aspect = state.size.width / Math.max(1, state.size.height);
    const narrow = THREE.MathUtils.clamp((1.4 - aspect) / 0.9, 0, 1);

    tmpP.lerpVectors(A.p, B.p, k);
    tmpT.lerpVectors(A.t, B.t, k);
    // intro: start lower, nearer to the night side
    tmpP.y -= (1 - intro) * 0.55;
    tmpP.z -= (1 - intro) * 2.2;
    // pull back on portrait screens so the limb still spans the frame
    tmpP.z += narrow * (1 - k) * 6; tmpP.y += narrow * (1 - k) * 2.3;
    tmpP.multiplyScalar(1 + narrow * k * 0.55);
    tmpT.y -= narrow * k * 4.5;
    // hand-held parallax
    tmpP.x += st.px * 0.35; tmpP.y += st.py * 0.18;
    cam.current.position.copy(tmpP);
    cam.current.lookAt(tmpT);
    cam.current.fov = THREE.MathUtils.lerp(A.fov, B.fov, k) * (1 + narrow * 0.28);
    cam.current.updateProjectionMatrix();

    sun.current.position.copy(cam.current.position).addScaledVector(SUN, 380);
    sun.current.quaternion.copy(cam.current.quaternion);
    sunMat.uniforms.uIntensity.value = 1.15 * (0.35 + 0.65 * intro);
  });

  const big = tier === 'low' ? 1024 : 2048;
  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={34} near={0.1} far={2000} position={A.p.toArray()} />
      <Sky onReady={onReady} />
      <mesh ref={sun} material={sunMat} renderOrder={1}>
        <planeGeometry args={[150, 150]} />
      </mesh>
      <Planet ref={planet} kind="ocean" seed={7} radius={10} size={big} priority={0} spin={0.006} tilt={0.32} segments={tier === 'low' ? 96 : 160} onReady={onReady} />
      <Planet ref={moon} kind="dwarf" seed={3} radius={1.5} size={512} priority={1} spin={0.004} tilt={0.1} segments={64} position={[-34, 9, -30]} onReady={onReady} />
    </>
  );
}

export default function HeroScene() {
  return (
    <View className="absolute inset-0" index={2}>
      <HeroContent />
    </View>
  );
}
