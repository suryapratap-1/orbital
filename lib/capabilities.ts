'use client';
import type { Tier } from './store';

let gpuName = '';

export function detectWebGL(): boolean {
  if (new URLSearchParams(location.search).has('nogl')) return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    gpuName = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectTier(): Tier {
  const q = new URLSearchParams(location.search).get('tier');
  if (q === 'high' || q === 'mid' || q === 'low') return q;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (/swiftshader|llvmpipe|software/i.test(gpuName)) return 'low';
  if (coarse && (cores <= 4 || mem <= 3)) return 'low';
  if (/intel|mesa|mali|adreno|powervr/i.test(gpuName) && !/arc/i.test(gpuName)) return 'mid';
  if (coarse || cores <= 4 || mem <= 4) return 'mid';
  return 'high';
}
