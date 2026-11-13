'use client';
import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NOISE, UV_TO_DIR } from './glsl';
import { ADDITIVE } from './planet/materials';
import { BAKE_VERT, enqueueBake, makeTarget } from './bakeQueue';
import { ui } from '@/lib/store';

function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const BAND_NORMAL = new THREE.Vector3(0.35, 0.86, -0.38).normalize();

const STAR_VERT = /* glsl */ `
attribute float aSize; attribute vec3 aColor; uniform float uDpr; varying vec3 vColor; varying float vSize;
void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
  vSize = aSize; gl_PointSize = aSize * uDpr; }`;
const STAR_FRAG = /* glsl */ `
varying vec3 vColor; varying float vSize;
void main(){ vec2 d = gl_PointCoord - .5; float r = length(d);
  float core = smoothstep(.5, .0, r); core *= core;
  float a = core * clamp(vSize / 2.2, .35, 1.);
  gl_FragColor = vec4(vColor * a, 1.);
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0., 1.);
}`;

const BAND_FRAG = /* glsl */ `
precision highp float; in vec2 vUv; out vec4 oColor; uniform vec3 uN;
${NOISE}
${UV_TO_DIR}
void main(){
  vec3 d = uvToDir(vUv);
  float lat = dot(d, uN);
  float w = fbm(d * 3. + 2., 5);
  float band = exp(-pow((lat + w * .08) / .2, 2.));
  float dust = smoothstep(.1, .55, fbm(d * 7. + 9., 6) * .5 + .5);
  float clouds = fbm(d * 5. + 4., 6) * .5 + .5;
  float glow = band * (.35 + .65 * clouds) * (1. - dust * .75 * band);
  vec3 col = mix(vec3(.36, .45, .62), vec3(.75, .62, .46), smoothstep(.2, .8, clouds)) * glow;
  // faint gold nebula patch near the destination
  col += vec3(.8, .55, .3) * smoothstep(.62, .0, length(d - normalize(vec3(-.6, .1, -.8)))) * .12 * clouds;
  oColor = vec4(min(col * 1.6, vec3(1.)), 1.);   // stored at full range: avoids 8-bit banding
}`;

const SKY_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_FRAG = /* glsl */ `uniform sampler2D uTex; uniform float uGain; varying vec2 vUv;
void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rgb * uGain * .053, 1.);
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0., 1.);
}`;

let bandCache: { tex: THREE.Texture; ready: boolean; waiters: (() => void)[] } | null = null;
/** Bake the faint galactic band once (shared by every view), progressively. */
export function getBand(onReady?: () => void) {
  if (!bandCache) {
    const target = makeTarget(1024, 512, 1);
    const material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: BAKE_VERT, fragmentShader: BAND_FRAG, uniforms: { uN: { value: BAND_NORMAL } }, depthTest: false, depthWrite: false });
    const c = { tex: target.textures[0] as THREE.Texture, ready: false, waiters: [] as (() => void)[] };
    enqueueBake({ priority: 5, target, material, rows: 64, onDone: () => { c.ready = true; c.waiters.splice(0).forEach((f) => f()); } });
    bandCache = c;
  }
  if (onReady) { if (bandCache.ready) onReady(); else bandCache.waiters.push(onReady); }
  return bandCache;
}

/** Seeded starfield (stars cluster along a galactic band) + a baked faint galactic glow. */
export function Sky({ radius = 600, gain = 1, count, onReady }: { radius?: number; gain?: number; count?: number; onReady?: () => void }) {
  const [bandReady, setBandReady] = useState(false);
  const dpr = useThree((s) => s.viewport.dpr);
  const tier = ui.get().tier;
  const n = count ?? (tier === 'low' ? 2600 : tier === 'mid' ? 4500 : 7000);

  const stars = useMemo(() => {
    const rnd = mulberry32(42);
    const pos = new Float32Array(n * 3), size = new Float32Array(n), col = new Float32Array(n * 3);
    const u = new THREE.Vector3(), tmp = new THREE.Vector3();
    const t1 = new THREE.Vector3(1, 0, 0).cross(BAND_NORMAL).normalize(), t2 = BAND_NORMAL.clone().cross(t1);
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.42) { // in the band
        const a = rnd() * Math.PI * 2, off = (rnd() + rnd() + rnd() - 1.5) * 0.22;
        u.copy(t1).multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)).addScaledVector(BAND_NORMAL, off).normalize();
      } else {
        tmp.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1); if (tmp.lengthSq() < 1e-4) tmp.set(1, 0, 0); u.copy(tmp.normalize());
      }
      pos.set([u.x * radius, u.y * radius, u.z * radius], i * 3);
      const m = Math.pow(rnd(), 9);
      size[i] = 0.9 + m * 3.6 + rnd() * 0.5;
      const k = rnd();
      const c = k < 0.12 ? [0.7, 0.8, 1.0] : k < 0.7 ? [1.0, 0.98, 0.95] : k < 0.9 ? [1.0, 0.9, 0.75] : [1.0, 0.75, 0.55];
      const b = 0.35 + m * 1.6 + rnd() * 0.35;
      col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.1);
    const mat = new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: { uDpr: { value: 1 } }, ...ADDITIVE, depthTest: true });
    return { g, mat };
  }, [n, radius]);

  const sky = useMemo(() => {
    const mat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: { uTex: { value: getBand().tex }, uGain: { value: gain } }, side: THREE.BackSide, ...ADDITIVE });
    return { mat, geo: new THREE.SphereGeometry(radius * 1.2, 48, 24) };
  }, [gain, radius]);
  useEffect(() => { getBand(() => { setBandReady(true); onReady?.(); }); }, [onReady]);

  useEffect(() => { stars.mat.uniforms.uDpr.value = dpr; }, [dpr, stars]);
  useEffect(() => () => { stars.g.dispose(); stars.mat.dispose(); sky.mat.dispose(); sky.geo.dispose(); }, [stars, sky]);

  return (
    <group renderOrder={-10}>
      <mesh geometry={sky.geo} material={sky.mat} renderOrder={-11} frustumCulled={false} visible={bandReady} />
      <points geometry={stars.g} material={stars.mat} renderOrder={-10} frustumCulled={false} />
    </group>
  );
}

const SUN_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform float uStreak; varying vec2 vUv;
void main(){
  vec2 p = vUv - .5; float r = length(p);
  float core = exp(-r * r * 900.) * 3.;
  float halo = exp(-r * 9.) * .55 + exp(-r * 26.) * .8;
  float streak = exp(-abs(p.y) * 260.) * exp(-abs(p.x) * 4.5) * uStreak;
  float a = (core + halo + streak) * smoothstep(.5, .3, r + abs(p.y) * 0.);
  gl_FragColor = vec4(uColor * a * uIntensity, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0., 1.);
}`;

/** Camera-facing glare sprite for a star. */
export function makeSunMaterial(color: THREE.ColorRepresentation = 0xfff2dc, intensity = 1, streak = 0.6) {
  return new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SUN_FRAG,
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uStreak: { value: streak } },
    ...ADDITIVE,
    depthTest: true,
  });
}
