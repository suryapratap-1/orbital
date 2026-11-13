import * as THREE from 'three';
import { precompile } from './precompile';

/**
 * Progressive GPU bakes. Heavy procedural textures are rendered a strip at a time (one strip per frame)
 * so integrated GPUs never stall for seconds on a single draw call.
 */
export type BakeJob = {
  priority: number;
  target: THREE.WebGLRenderTarget;
  material: THREE.Material;
  rows: number;
  next: number;
  onDone?: () => void;
  cancelled?: boolean;
  compile?: 'pending' | 'done';
};

const jobs: BakeJob[] = [];
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
quad.frustumCulled = false;
scene.add(quad);

export function enqueueBake(job: Omit<BakeJob, 'next'>): BakeJob {
  const j = { ...job, next: 0 };
  jobs.push(j);
  jobs.sort((a, b) => a.priority - b.priority);
  return j;
}

export function cancelBake(job: BakeJob) {
  job.cancelled = true;
  const i = jobs.indexOf(job);
  if (i >= 0) jobs.splice(i, 1);
}

export const pendingBakes = () => jobs.length;

/** Render up to `strips` strips of the highest-priority job. Call once per frame. */
export function stepBakes(gl: THREE.WebGLRenderer, strips = 1) {
  if (!jobs.length) return;
  const prevTarget = gl.getRenderTarget();
  const prevScissor = gl.getScissorTest();
  const prevAuto = gl.autoClear;
  gl.autoClear = false;
  for (let s = 0; s < strips && jobs.length; s++) {
    const job = jobs[0];
    if (job.compile !== 'done') {
      if (!job.compile) { job.compile = 'pending'; precompile(gl, [job.material], cam).then(() => { job.compile = 'done'; }); }
      break;
    }
    const { target: t } = job;
    const h = t.height;
    const y = job.next;
    const last = y + job.rows >= h;
    quad.material = job.material;
    t.scissor.set(0, y, t.width, Math.min(job.rows, h - y));
    t.scissorTest = true;
    gl.setRenderTarget(t);
    gl.render(scene, cam);
    job.next += job.rows;
    if (last) {
      t.scissorTest = false;
      jobs.shift();
      job.material.dispose();
      job.onDone?.();
    }
  }
  gl.setRenderTarget(prevTarget);
  gl.setScissorTest(prevScissor);
  gl.autoClear = prevAuto;
}

export function makeTarget(width: number, height: number, count = 1) {
  const t = new THREE.WebGLRenderTarget(width, height, {
    count,
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
  });
  for (const tex of t.textures) {
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 8;
  }
  return t;
}

export const BAKE_VERT = /* glsl */ `in vec3 position; in vec2 uv; out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
