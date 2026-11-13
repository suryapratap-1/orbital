'use client';
import { PerspectiveCamera, View } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Planet, type PlanetHandle } from '../planet/Planet';
import { Sky, makeSunMaterial } from '../Sky';
import { NOISE } from '../glsl';
import { SYSTEM, type Planet as PlanetData } from '@/lib/mission';
import { frame, ui } from '@/lib/store';
import { systemBus } from '@/lib/systemBus';

const damp = (c: number, t: number, r: number, dt: number) => c + (t - c) * (1 - Math.exp(-r * dt));
const SPEED: Record<string, number> = { ember: 0.16, calder: 0.09, halden: 0.055, morrow: 0.03, tithe: 0.015 };
const PHASE: Record<string, number> = { ember: 0.4, calder: 2.2, halden: 4.1, morrow: 5.3, tithe: 1.2 };

const STAR_FRAG = /* glsl */ `
uniform float uTime; varying vec3 vN; varying vec3 vP;
${NOISE}
void main(){
  float mu = clamp(dot(normalize(vN), normalize(cameraPosition - vP)), 0., 1.);
  float limb = .45 + .55 * pow(mu, .55);
  float g = fbm(normalize(vP) * 7. + vec3(uTime * .05), 4) * .5 + .5;
  vec3 c = mix(vec3(1., .42, .14), vec3(1., .74, .45), g) * limb * 1.35;
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const STAR_VERT = /* glsl */ `varying vec3 vN; varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix * viewMatrix * w; }`;

const RING_FRAG = /* glsl */ `
uniform vec3 uLight; varying vec2 vUv; varying vec3 vW; uniform float uInner;
void main(){
  float r = vUv.x; // 0 inner → 1 outer (remapped in vertex)
  float b = .55 + .45 * sin(r * 70.) * sin(r * 23. + 1.3);
  float gap = smoothstep(.56, .58, r) * (1. - smoothstep(.62, .64, r));
  float a = (1. - gap * .9) * smoothstep(0., .04, r) * (1. - smoothstep(.94, 1., r)) * b * .55;
  vec3 c = mix(vec3(.62, .55, .45), vec3(.85, .8, .7), b) * .9;
  gl_FragColor = vec4(c * a, a);
  #include <colorspace_fragment>
}`;
const RING_VERT = /* glsl */ `
uniform float uInner; uniform float uOuter; varying vec2 vUv; varying vec3 vW;
void main(){ float r = length(position.xy); vUv = vec2((r - uInner) / (uOuter - uInner), 0.); vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

function Orbit({ r, selected }: { r: number; selected: boolean }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color: 0xe8edf5, transparent: true, opacity: 0.14, depthWrite: false });
    return new THREE.Line(g, m);
  }, [r]);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); }, [line]);
  useFrame((_, dt) => {
    const m = line.material as THREE.LineBasicMaterial;
    m.opacity = damp(m.opacity, selected ? 0.85 : 0.14, 4, Math.min(dt, 0.05));
    m.color.set(selected ? 0xd7a85a : 0xe8edf5);
  });
  return <primitive object={line} />;
}

function Rings({ radius }: { radius: number }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: RING_VERT, fragmentShader: RING_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { uLight: { value: new THREE.Vector3() }, uInner: { value: radius * 1.35 }, uOuter: { value: radius * 2.3 } },
  }), [radius]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh rotation={[-Math.PI / 2 + 0.42, 0, 0.18]} material={mat}>
      <ringGeometry args={[radius * 1.35, radius * 2.3, 128, 1]} />
    </mesh>
  );
}

function World({ p, idx }: { p: PlanetData; idx: number }) {
  const ref = useRef<PlanetHandle>(null);
  const holder = useRef<THREE.Group>(null!);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const reduced = ui.get().reduced;
  const tier = ui.get().tier;
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    const a = PHASE[p.id] + t * SPEED[p.id] * 0.15;
    holder.current.position.set(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit);
    systemBus.positions.set(p.id, holder.current.position);
    dir.copy(holder.current.position).multiplyScalar(-1).normalize();
    ref.current?.setSun(dir);
  });
  return (
    <group ref={holder}>
      <Planet ref={ref} kind={p.kind} seed={p.seed} radius={p.radius} size={tier === 'low' ? 512 : 1024} priority={20 + idx} spin={0.05} tilt={p.kind === 'giant' ? 0.2 : 0.35} segments={64}
        onClick={(e) => { e.stopPropagation(); ui.set({ planet: p.id }); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }} />
      {p.kind === 'giant' && <Rings radius={p.radius} />}
    </group>
  );
}

function SystemContent() {
  const cam = useRef<THREE.PerspectiveCamera>(null!);
  const size = useThree((s) => s.size);
  const selected = ui.use((s) => s.planet);
  const starMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: { uTime: { value: 0 } } }), []);
  const glow = useMemo(() => makeSunMaterial(0xffb877, 0.75, 0.3), []);
  const glowRef = useRef<THREE.Mesh>(null!);
  const st = useRef({ pos: new THREE.Vector3(0, 14, 30), look: new THREE.Vector3(), enter: 0 });
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), off: new THREE.Vector3() }), []);
  const reduced = ui.get().reduced;
  useEffect(() => () => { starMat.dispose(); glow.dispose(); }, [starMat, glow]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    starMat.uniforms.uTime.value = state.clock.elapsedTime;
    const s = st.current;
    s.enter = reduced ? 1 : damp(s.enter, frame.explore, 5, dt);
    const aspect = size.width / Math.max(1, size.height);
    const narrow = THREE.MathUtils.clamp((1.3 - aspect) / 0.8, 0, 1);
    const sel = SYSTEM.find((p) => p.id === selected);
    if (sel) {
      const pp = systemBus.positions.get(sel.id) ?? tmp.l.set(sel.orbit, 0, 0);
      const k = sel.radius * (6.5 + narrow * 4) + 1.2;
      // camera sits sunward of the planet, rotated ~40° so the terminator shows; slightly above the plane
      tmp.off.copy(pp).normalize().multiplyScalar(-k).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.7);
      tmp.off.y += k * 0.28;
      tmp.p.copy(pp).add(tmp.off);
      tmp.l.copy(pp);
      // shift the planet left of centre so the data panel has room (desktop)
      const side = new THREE.Vector3().subVectors(tmp.p, pp).cross(new THREE.Vector3(0, 1, 0)).normalize();
      tmp.l.addScaledVector(side, sel.radius * 1.1 * (1 - narrow));
      tmp.l.y -= sel.radius * 0.6 * narrow;
    } else {
      const d = 1 + narrow * 0.9;
      tmp.p.set(-4, 19 * d, 33 * d).multiplyScalar(1 + (1 - s.enter) * 0.6);
      tmp.l.set(3.5 * (1 - narrow), -3 + narrow * 2, 0);
    }
    const r = reduced ? 100 : 2.4;
    s.pos.x = damp(s.pos.x, tmp.p.x, r, dt); s.pos.y = damp(s.pos.y, tmp.p.y, r, dt); s.pos.z = damp(s.pos.z, tmp.p.z, r, dt);
    s.look.x = damp(s.look.x, tmp.l.x, r * 1.2, dt); s.look.y = damp(s.look.y, tmp.l.y, r * 1.2, dt); s.look.z = damp(s.look.z, tmp.l.z, r * 1.2, dt);
    cam.current.position.copy(s.pos);
    cam.current.lookAt(s.look);
    glowRef.current.quaternion.copy(cam.current.quaternion);

    // project planet labels for the DOM layer
    for (const p of SYSTEM) {
      const el = systemBus.labels.get(p.id);
      const pos = systemBus.positions.get(p.id);
      if (!el || !pos) continue;
      tmp.p.copy(pos); tmp.p.y += p.radius * 1.25;
      tmp.p.project(cam.current);
      const behind = tmp.p.z > 1;
      const x = (tmp.p.x * 0.5 + 0.5) * size.width, y = (-tmp.p.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = behind || (sel && sel.id !== p.id) ? '0' : '1';
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={32} near={0.05} far={3000} position={[0, 14, 30]} />
      <Sky count={3600} gain={0.8} />
      <mesh material={starMat}><sphereGeometry args={[1.1, 64, 32]} /></mesh>
      <mesh ref={glowRef} material={glow} renderOrder={3}><planeGeometry args={[11, 11]} /></mesh>
      {SYSTEM.map((p, i) => (
        <group key={p.id}>
          <Orbit r={p.orbit} selected={selected === p.id} />
          <World p={p} idx={i} />
        </group>
      ))}
    </>
  );
}

export default function SystemScene({ className }: { className?: string }) {
  return (
    <View className={className} index={4}>
      <SystemContent />
    </View>
  );
}
