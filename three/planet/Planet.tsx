'use client';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { precompile } from '../precompile';
import * as THREE from 'three';
import { bakePlanet } from './bake';
import { makeAtmosphereMaterial, makeSurfaceMaterial } from './materials';
import type { PlanetKind } from '@/lib/mission';

const LOOK: Record<PlanetKind, { atmo: number; atmoStrength: number; shell: number; emit: number; bump: number; cloudSpeed: number; shellGain: number; power: number }> = {
  ocean: { atmo: 0x6fa9de, atmoStrength: 0.5, shell: 1.022, emit: 0x000000, bump: 2.4, cloudSpeed: 0.0016, shellGain: 0.9, power: 3.2 },
  lava: { atmo: 0xc0703a, atmoStrength: 0.12, shell: 1.03, emit: 0xff6a1f, bump: 3.0, cloudSpeed: 0, shellGain: 0.35, power: 3 },
  ice: { atmo: 0xa9d2ee, atmoStrength: 0.2, shell: 1.035, emit: 0x000000, bump: 1.6, cloudSpeed: 0, shellGain: 0.5, power: 3 },
  giant: { atmo: 0xd8c8a8, atmoStrength: 0.35, shell: 1.04, emit: 0x000000, bump: 0, cloudSpeed: 0, shellGain: 0.7, power: 2.4 },
  dwarf: { atmo: 0x000000, atmoStrength: 0, shell: 1.0, emit: 0x000000, bump: 3.2, cloudSpeed: 0, shellGain: 0, power: 3 },
};

export type PlanetHandle = { group: THREE.Group; setSun: (worldDir: THREE.Vector3) => void };

type Props = {
  kind: PlanetKind;
  seed: number;
  radius?: number;
  size?: number;
  spin?: number;
  tilt?: number;
  segments?: number;
  /** bake order: lower first */
  priority?: number;
  onReady?: () => void;
} & Omit<ThreeElements['group'], 'ref'>;

export const Planet = forwardRef<PlanetHandle, Props>(function Planet(
  { kind, seed, radius = 1, size = 1024, spin = 0.01, tilt = 0.25, segments = 128, priority = 10, onReady, ...rest },
  ref,
) {
  const [ready, setReady] = useState(false);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Mesh>(null!);
  const look = LOOK[kind];

  // created in an effect (not useMemo) so StrictMode's mount → unmount → mount re-creates instead of reusing a disposed bake
  const [res, setRes] = useState<{ surface: THREE.ShaderMaterial; atmo: THREE.ShaderMaterial | null } | null>(null);
  useEffect(() => {
    let alive = true;
    const surface = makeSurfaceMaterial(null, null, { atmo: look.atmo, atmoStrength: look.atmoStrength, emit: look.emit, bump: look.bump, cloudSpeed: look.cloudSpeed });
    const atmo = look.shellGain > 0 ? makeAtmosphereMaterial(look.atmo, look.shellGain, look.power, look.shell) : null;
    const compiled = precompile(gl, atmo ? [surface, atmo] : [surface], camera);
    const baked = bakePlanet(kind, seed, size, priority, () => { compiled.then(() => { if (alive) setReady(true); }); });
    surface.uniforms.uAlbedo.value = baked.albedo;
    surface.uniforms.uData.value = baked.data;
    surface.uniforms.uTexel.value.set(1 / size, 2 / size);
    setRes({ surface, atmo });
    return () => { alive = false; setReady(false); baked.dispose(); surface.dispose(); atmo?.dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, seed, size, look, priority]);

  const geo = useMemo(() => new THREE.SphereGeometry(1, segments, Math.round(segments / 2)), [segments]);

  useEffect(() => { if (ready) onReady?.(); }, [ready, onReady]);
  useEffect(() => () => geo.dispose(), [geo]);

  const api = useMemo<PlanetHandle>(() => ({
    get group() { return group.current; },
    setSun: (dir: THREE.Vector3) => {
      res?.surface.uniforms.uSun.value.copy(dir);
      res?.atmo?.uniforms.uSun.value.copy(dir);
    },
  }), [res]);
  useImperativeHandle(ref, () => api, [api]);

  useFrame((_, dt) => {
    if (!res) return;
    res.surface.uniforms.uTime.value += Math.min(dt, 0.05);
    if (spin) body.current.rotation.y += spin * Math.min(dt, 0.05);
  });

  if (!res) return <group ref={group} />;
  return (
    <group ref={group} {...rest} visible={ready && rest.visible !== false}>
      <group rotation={[0, 0, tilt]}>
        <mesh ref={body} geometry={geo} material={res.surface} scale={radius} />
      </group>
      {res.atmo && <mesh geometry={geo} material={res.atmo} scale={radius * look.shell} renderOrder={2} />}
    </group>
  );
});
