'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { VESSEL } from '@/lib/mission';
import { frame, ui } from '@/lib/store';
import { vesselBus } from '@/lib/vesselBus';
import RollText from '../ui/RollText';

const VesselScene = dynamic(() => import('@/three/scenes/VesselScene'), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

const BEATS = [
  { k: 'Approach', t: 'Ninety-eight metres of shield, ring, tanks and drive.' },
  { k: 'Inspect', t: 'Drag to turn her. Select a component to read it.' },
  { k: 'Exploded', t: 'Every module comes apart for repair by hand.' },
];

export default function Vessel() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const webgl = ui.use((s) => s.webgl);
  const reduced = ui.use((s) => s.reduced);
  const exploded = ui.use((s) => s.exploded);
  const active = ui.use((s) => s.hotspot);
  const current = VESSEL.hotspots.find((h) => h.id === active);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        frame.vessel = self.progress;
        const beat = self.progress < 0.3 ? 0 : self.progress < 0.72 ? 1 : 2;
        root.current?.setAttribute('data-beat', String(beat));
      },
    });
    if (!reduced) gsap.from('.vessel__title .ch', { yPercent: 110, stagger: 0.05, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 60%' } });
  }, { scope: root, dependencies: [reduced] });

  // drag-to-rotate with inertia + keyboard rotation
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let dragging = false, lx = 0, ly = 0, vx = 0;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      dragging = true; lx = e.clientX; ly = e.clientY; vx = 0;
      el.setPointerCapture(e.pointerId); el.dataset.dragging = 'true';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - lx) / el.clientWidth, dy = (e.clientY - ly) / el.clientHeight;
      lx = e.clientX; ly = e.clientY;
      vx = dx * Math.PI * 2.2;
      frame.dragYaw += vx;
      frame.dragPitch = Math.max(-0.5, Math.min(0.5, frame.dragPitch + dy * 1.4));
    };
    const up = (e: PointerEvent) => { dragging = false; el.dataset.dragging = 'false'; if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); };
    const tick = () => {
      if (dragging) return;
      vx *= 0.94; if (Math.abs(vx) > 1e-4) frame.dragYaw += vx;
      frame.dragPitch *= 0.97;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    gsap.ticker.add(tick);
    return () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); gsap.ticker.remove(tick);
    };
  }, []);

  const rotate = (dir: number) => gsap.to(frame, { dragYaw: frame.dragYaw + dir * Math.PI / 4, duration: reduced ? 0 : 1.1, ease: 'power3.out' });
  const reset = () => { gsap.to(frame, { dragYaw: 0, dragPitch: 0, duration: reduced ? 0 : 1.2, ease: 'power3.inOut' }); ui.set({ hotspot: null, exploded: false }); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); rotate(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); rotate(1); }
    if (e.key === 'Escape') ui.set({ hotspot: null });
  };

  return (
    <section id="vessel" ref={root} className="vessel" aria-labelledby="vessel-title" data-beat="0" data-panel={current ? 'open' : undefined}>
      <div className="vessel__sticky">
        <div ref={stage} className="vessel__stage" tabIndex={0} role="group" onKeyDown={onKey}
          aria-label="ORION-01 spacecraft viewer. Drag or use the left and right arrow keys to rotate. Use the component buttons to read about each module.">
          {webgl && <VesselScene className="absolute inset-0" />}
          {webgl === false && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="vessel__poster" src="/posters/vessel.webp" alt="Rendered view of the ORION-01 spacecraft: dust shield, crew ring, propellant tanks, radiator wings and fusion drive." loading="lazy" />
          )}
          {webgl && (
            <div className="hotspots">
              {VESSEL.hotspots.map((h) => (
                <button key={h.id} type="button" className="hotspot"
                  ref={(el) => { if (el) vesselBus.hotspots.set(h.id, el); else vesselBus.hotspots.delete(h.id); }}
                  aria-pressed={active === h.id} aria-controls="vessel-panel"
                  onClick={() => ui.set({ hotspot: active === h.id ? null : h.id })}>
                  <span className="hotspot__dot" aria-hidden />
                  <span className="hotspot__lead" aria-hidden />
                  <span className="hotspot__label label">{h.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="vessel__copy">
          <p className="label text-faint"><span className="idx text-gold">03</span> — The Vessel</p>
          <h2 id="vessel-title" className="vessel__title display text-h2" aria-label="ORION-01">
            <span className="mask" aria-hidden>{'ORION-01'.split('').map((c, i) => <span key={i} className="ch">{c}</span>)}</span>
          </h2>
          <p className="text-dim measure">{VESSEL.intro}</p>
        </div>

        <ol className="vessel__beats" aria-hidden>
          {BEATS.map((b, i) => (
            <li key={b.k} data-i={i}><span className="idx text-micro">0{i + 1}</span><span className="label">{b.k}</span><span className="text-small text-dim">{b.t}</span></li>
          ))}
        </ol>

        <dl className="vessel__specs">
          {VESSEL.specs.map((s) => (<div key={s.k}><dt className="label text-faint">{s.k}</dt><dd className="num text-lead">{s.v}</dd></div>))}
        </dl>

        <div className="vessel__controls" role="toolbar" aria-label="Spacecraft controls">
          <button type="button" className="btn-ghost icon" onClick={() => rotate(-1)} aria-label="Rotate left">←</button>
          <button type="button" className="btn-ghost icon" onClick={() => rotate(1)} aria-label="Rotate right">→</button>
          <button type="button" className="btn-ghost" aria-pressed={exploded} onClick={() => ui.set({ exploded: !exploded })}><RollText>Exploded view</RollText></button>
          <button type="button" className="btn-ghost" onClick={reset}><RollText>Reset</RollText></button>
        </div>

        <aside id="vessel-panel" className="vessel__panel" data-open={!!current} aria-live="polite">
          {current ? (
            <>
              <p className="label text-gold">{current.label}</p>
              <h3 className="display text-h4">{current.title}</h3>
              <p className="text-dim text-small">{current.body}</p>
              <p className="num text-small text-atmo">{current.spec}</p>
              <button type="button" className="vessel__close label" onClick={() => ui.set({ hotspot: null })}>Close <span aria-hidden>×</span></button>
            </>
          ) : (
            <p className="text-small text-faint">Select a component on the ship.</p>
          )}
          {webgl === false && (
            <ul className="vessel__list">
              {VESSEL.hotspots.map((h) => (<li key={h.id}><button type="button" className="btn-ghost" aria-pressed={active === h.id} onClick={() => ui.set({ hotspot: h.id })}>{h.label}</button></li>))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
