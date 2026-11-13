'use client';
import { useSyncExternalStore } from 'react';

/** Tiny external store: React-visible UI state shared between the DOM layer and the 3D layer. */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  const get = () => state;
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    let changed = false;
    for (const k in next) if (!Object.is(state[k], next[k])) { changed = true; break; }
    if (!changed) return;
    state = { ...state, ...next };
    subs.forEach((f) => f());
  };
  const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
  function use<U>(sel: (s: T) => U): U {
    return useSyncExternalStore(subscribe, () => sel(state), () => sel(initial));
  }
  return { get, set, subscribe, use };
}

export type Tier = 'high' | 'mid' | 'low';

export const ui = createStore({
  /** null until detected on the client */
  webgl: null as boolean | null,
  reduced: false,
  tier: 'high' as Tier,
  coarse: false,
  loaded: false,
  /** loader tasks still pending */
  pending: ['fonts', 'gl', 'hero'] as string[],
  planet: null as string | null,
  hotspot: null as string | null,
  exploded: false,
  menuOpen: false,
});

export function completeTask(id: string) {
  ui.set((s) => ({ pending: s.pending.filter((p) => p !== id) }));
}

/** Per-frame values written by GSAP/DOM and read inside useFrame — never trigger React renders. */
export const frame = {
  hero: 0,
  vessel: 0,
  explore: 0,
  page: 0,
  pointerX: 0,
  pointerY: 0,
  velocity: 0,
  /** vessel drag rotation target (radians) */
  dragYaw: 0,
  dragPitch: 0,
};
