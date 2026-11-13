'use client';
import type Lenis from 'lenis';

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; };
export const getLenis = () => lenis;

/** Smooth-scroll to a section id (falls back to native scrolling when Lenis is off). */
export function scrollToId(id: string, opts: { immediate?: boolean } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: opts.immediate ? 0 : 1.6, immediate: opts.immediate, force: true, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: opts.immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  // move focus for keyboard and screen-reader users without a second scroll jump
  const heading = el.querySelector<HTMLElement>('h2, h1');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
}
