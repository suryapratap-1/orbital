'use client';
import { useEffect, useRef, useState } from 'react';
import { ui } from '@/lib/store';

const TOTAL = 3; // fonts, gl, hero
const W = 520;

/** Brand moment: a noisy carrier wave locks into the straight gold signal line, then the overlay wipes away. */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0, last = -1, shown = 0, prev = performance.now();
    const t0 = prev;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - prev) / 1000)); prev = now;
      const pending = ui.get().pending.length;
      const real = (TOTAL - Math.min(TOTAL, pending)) / TOTAL;
      const paced = 100 * (1 - Math.pow(1 - Math.min(1, (now - t0) / (reduced ? 400 : 1700)), 3));
      const goal = Math.min(paced, real >= 1 ? 100 : Math.max(real * 100, Math.min(94, shown + dt * 6)));
      shown += (goal - shown) * (1 - Math.exp(-9 * dt));
      if (real >= 1 && paced >= 100 && shown > 99.6) shown = 100;
      const v = Math.round(shown);
      if (v !== last && pct.current) {
        pct.current.textContent = String(v).padStart(3, '0');
        if (status.current) status.current.textContent = v < 40 ? 'Acquiring carrier' : v < 90 ? 'Locking signal' : 'Signal locked';
        last = v;
      }
      // waveform: amplitude falls as the lock improves
      if (path.current) {
        const amp = 26 * Math.pow(1 - shown / 100, 1.4);
        const t = now / 1000;
        let d = `M0 40`;
        for (let x = 0; x <= W; x += 6) {
          const env = Math.sin((x / W) * Math.PI);
          const y = 40 + env * amp * (Math.sin(x * 0.07 + t * 7) * 0.6 + Math.sin(x * 0.19 - t * 11) * 0.3 + Math.sin(x * 0.031 + t * 3) * 0.4);
          d += ` L${x} ${y.toFixed(2)}`;
        }
        path.current.setAttribute('d', d);
      }
      if (shown >= 100) {
        root.current?.classList.add('is-done');
        window.setTimeout(() => ui.set({ loaded: true }), reduced ? 0 : 450);
        window.setTimeout(() => setGone(true), reduced ? 50 : 1700);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="loader" role="status" aria-live="polite" aria-label="Loading ORBITAL">
      <div className="loader__center">
        <span className="label text-faint">Vesper relay · Lantern chain</span>
        <svg className="loader__wave" viewBox={`0 0 ${W} 80`} preserveAspectRatio="none" aria-hidden>
          <path ref={path} d={`M0 40 L${W} 40`} fill="none" stroke="var(--color-gold)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        </svg>
        <span ref={status} className="label text-dim">Acquiring carrier</span>
      </div>
      <div className="loader__corner">
        <span className="label text-faint">Signal</span>
        <span ref={pct} className="num text-lead text-star">000</span>
      </div>
      <div className="loader__corner loader__corner--left label text-faint">ORBITAL · Expedition Vesper</div>
    </div>
  );
}
