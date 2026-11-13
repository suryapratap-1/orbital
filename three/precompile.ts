import * as THREE from 'three';

const geo = new THREE.PlaneGeometry(1, 1);

/**
 * Compile materials off the critical path (KHR_parallel_shader_compile when available), so the first
 * frame that shows them doesn't stall. `target` supplies lights/environment for lit materials.
 */
export function precompile(gl: THREE.WebGLRenderer, materials: THREE.Material[], camera: THREE.Camera, target?: THREE.Scene) {
  const tmp = new THREE.Scene();
  for (const m of materials) tmp.add(new THREE.Mesh(geo, m));
  return gl.compileAsync(tmp, camera, target ?? null).catch(() => undefined);
}
