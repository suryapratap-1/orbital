import type * as THREE from 'three';

/** Shared between the system scene (writes positions, moves labels) and the DOM layer (label buttons). */
export const systemBus = {
  positions: new Map<string, THREE.Vector3>(),
  labels: new Map<string, HTMLElement>(),
};
