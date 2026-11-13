'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { frame, ui } from '@/lib/store';
import { distanceAt, formatDelay } from '@/lib/signal';

/** The concept device as a permanent readout: one-way signal delay shrinks to zero as the transmission reaches you. */
export default function SignalHud() {
  const val = useRef<HTMLSpanElement>(null);
  const unit = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const loaded = ui.use((s) => s.loaded);

  useEffect(() => {
    let lastV = '', lastU = '', lastP = -1;
    const tick = () => {
      const p = frame.page;
      const { value, unit: u } = formatDelay(distanceAt(p));
      if (value !== lastV && val.current) { val.current.textContent = value; lastV = value; }
      if (u !== lastU && unit.current) { unit.current.textContent = u; lastU = u; }
      if (Math.abs(p - lastP) > 0.001 && bar.current) { bar.current.style.transform = `scaleX(${1 - p})`; lastP = p; }
      root.current?.toggleAttribute('data-received', p >= 0.995);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div ref={root} className="hud" data-show={loaded} aria-hidden>
      <span className="label text-faint hud__label">Signal delay <span className="hud__route">Vesper → Earth</span></span>
      <span className="hud__value"><span ref={val} className="num">6.20</span> <span ref={unit} className="num hud__unit">yr</span></span>
      <span className="hud__track"><span ref={bar} className="hud__bar" /></span>
    </div>
  );
}
