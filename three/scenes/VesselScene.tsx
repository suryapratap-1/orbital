'use client';
import { PerspectiveCamera, useGLTF, View } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { precompile } from '../precompile';
import * as THREE from 'three';
import { Sky } from '../Sky';
import { frame, ui } from '@/lib/store';
import { VESSEL } from '@/lib/mission';
import { vesselBus } from '@/lib/vesselBus';

const URL = '/models/orion-01.glb';

/** Exploded-view offsets per module (model units). */
const EXPLODE: Record<string, [number, number, number]> = {
  shield: [0, 0, 2.6], hab: [0, 0, 1.4], comms: [0, 1.2, 1.6], spine: [0, 0, 0],
  tanks: [0, 0, -0.2], radiators: [0, 0, -1.1], drive: [0, 0, -2.6],
};

/** Crinkled MLI foil normal map, painted once on a canvas. */
function foilNormal() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, s, s);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * s, y = rnd() * s, w = 6 + rnd() * 40, h = 4 + rnd() * 30, a = rnd() * Math.PI;
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = `rgba(${100 + rnd() * 56},${100 + rnd() * 56},255,0.35)`;
    g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(0, -h / 2); g.lineTo(w / 2, 0); g.lineTo(0, h / 2); g.closePath(); g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}

/** A dark studio for reflections: one sun panel, a cool planet bounce from below, a warm rim. */
function useSpaceEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x020409);
    const panel = (color: number, intensity: number, pos: [number, number, number], size: [number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(0xfff1dc, 14, [8, 6, 6], [4, 4]);         // sun
    panel(0x2a5a8a, 1.2, [0, -10, 0], [30, 30]);     // planet bounce
    panel(0xd7a85a, 2.2, [-8, 2, -6], [3, 10]);      // warm rim
    panel(0x91c8e8, 0.6, [-6, 6, 8], [6, 6]);        // soft fill
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(env, 0.02).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.9;
    return () => { scene.environment = null; tex.dispose(); pmrem.dispose(); env.traverse((o) => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).geometry.dispose(); ((o as THREE.Mesh).material as THREE.Material).dispose(); } }); };
  }, [gl, scene]);
}

const damp = (c: number, t: number, r: number, dt: number) => c + (t - c) * (1 - Math.exp(-r * dt));
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function Ship() {
  const { scene } = useGLTF(URL, false, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const root = useRef<THREE.Group>(null!);
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const parts = useMemo(() => {
    const m = new Map<string, THREE.Object3D>();
    model.children.forEach((c) => m.set(c.name, c));
    return m;
  }, [model]);
  const st = useRef({ yaw: -0.9, pitch: 0.18, explode: 0, prog: 0, spin: 0 });
  const v = useMemo(() => ({ w: new THREE.Vector3(), c: new THREE.Vector3(), n: new THREE.Vector3(), cam: new THREE.Vector3() }), []);
  const reduced = ui.get().reduced;
  const gl = useThree((s) => s.gl);
  const scene3 = useThree((s) => s.scene);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const foil = foilNormal();
    const mats = new Set<THREE.Material>();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.name === 'foil') { mat.normalMap = foil; mat.normalScale.set(0.55, 0.55); mat.roughness = 0.28; mat.envMapIntensity = 1.4; }
      if (mat.name === 'titanium') mat.envMapIntensity = 1.2;
      if (mat.name === 'radiator') { mat.envMapIntensity = 0.8; mat.emissive = new THREE.Color(0x2a0c04); }
      if (mat.name === 'paint') mat.envMapIntensity = 0.7;
      mat.needsUpdate = true;
      mats.add(mat);
    });
    let alive = true;
    // wait a frame so the environment map is attached, then compile without stalling
    requestAnimationFrame(() => precompile(gl, [...mats], cam, scene3).then(() => { if (alive) setShown(true); }));
    vesselBus.ready = true;
    return () => { alive = false; foil.dispose(); vesselBus.ready = false; };
  }, [model, gl, cam, scene3]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = st.current;
    s.prog = reduced ? frame.vessel : damp(s.prog, frame.vessel, 6, dt);
    const p = s.prog;
    // scroll choreography: approach → slow orbit → exploded
    const approach = 1 - sstep(0, 0.28, p);
    const scrollYaw = -0.9 + sstep(0.05, 0.75, p) * 2.1;
    const wantExplode = Math.max(ui.get().exploded ? 1 : 0, sstep(0.72, 0.95, p));
    s.explode = reduced ? wantExplode : damp(s.explode, wantExplode, 4, dt);
    // drag adds to the scroll yaw, with inertia handled in the DOM layer
    s.yaw = scrollYaw + frame.dragYaw;
    s.pitch = 0.16 + frame.dragPitch;
    if (!reduced) s.spin += dt * 0.025;
    root.current.rotation.set(s.pitch, s.yaw + s.spin, -0.12 * approach + 0.05);
    root.current.position.set(-4 * approach, -1.6 * approach, -14 * approach);
    for (const [name, obj] of parts) {
      const o = EXPLODE[name]; if (!o) continue;
      obj.position.set(o[0] * s.explode, o[1] * s.explode, o[2] * s.explode);
    }
    // camera framing, pulled back on narrow screens
    const aspect = size.width / Math.max(1, size.height);
    const narrow = THREE.MathUtils.clamp((1.3 - aspect) / 0.8, 0, 1);
    const dist = 22 + s.explode * 4.5 + narrow * 14;
    cam.position.set(dist * 0.05, 1.6 + narrow * 1.5, dist);
    cam.lookAt(-(1 - narrow) * 1.6, narrow * 3.2, 0);

    // project hotspots into the view's rect for the DOM layer
    root.current.updateMatrixWorld();
    v.cam.copy(cam.position);
    v.c.setFromMatrixPosition(root.current.matrixWorld);
    for (const h of VESSEL.hotspots) {
      const el = vesselBus.hotspots.get(h.id);
      if (!el) continue;
      const part = parts.get(h.id);
      v.w.set(...h.p);
      if (part) v.w.add(part.position);
      v.w.applyMatrix4(root.current.matrixWorld);
      v.n.copy(v.w).sub(v.c).normalize();
      const facing = v.n.dot(v.cam.clone().sub(v.c).normalize());
      v.w.project(cam);
      const x = (v.w.x * 0.5 + 0.5) * size.width;
      const y = (-v.w.y * 0.5 + 0.5) * size.height;
      const vis = Math.min(1, Math.max(0, (facing + 0.45) / 0.4)) * (1 - approach);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = vis.toFixed(3);
      el.dataset.hidden = vis < 0.15 ? 'true' : 'false';
    }
  });

  return <group ref={root} visible={shown}><primitive object={model} /></group>;
}

function Lights() {
  return (
    <>
      <directionalLight position={[8, 6, 6]} intensity={3.4} color="#fff1dc" />
      <directionalLight position={[-6, -8, -2]} intensity={0.25} color="#4d7fb0" />
      <directionalLight position={[-8, 2, -8]} intensity={1.1} color="#d7a85a" />
      <ambientLight intensity={0.05} />
    </>
  );
}

function VesselContent() {
  useSpaceEnvironment();
  return (
    <>
      <PerspectiveCamera makeDefault fov={24} near={0.1} far={2000} position={[0, 2, 22]} />
      <Sky count={2400} gain={0.35} />
      <Lights />
      <Ship />
    </>
  );
}

useGLTF.preload(URL, false, true);

export default function VesselScene({ className }: { className?: string }) {
  return (
    <View className={className} index={3}>
      <VesselContent />
    </View>
  );
}
