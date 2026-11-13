'use client';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SYSTEM } from '@/lib/mission';
import { frame, ui } from '@/lib/store';
import { systemBus } from '@/lib/systemBus';

const SystemScene = dynamic(() => import('@/three/scenes/SystemScene'), { ssr: false });
gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Explore() {
  const root = useRef<HTMLElement>(null);
  const webgl = ui.use((s) => s.webgl);
  const selected = ui.use((s) => s.planet);
  const reduced = ui.use((s) => s.reduced);
  const p = SYSTEM.find((x) => x.id === selected);

  useGSAP(() => {
    ScrollTrigger.create({ trigger: root.current, start: 'top bottom', end: 'top top', scrub: true, onUpdate: (self) => { frame.explore = self.progress; } });
    if (!reduced) gsap.from('.explore__rail li', { x: -30, autoAlpha: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 45%' } });
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="explore" ref={root} className="explore" aria-labelledby="explore-title">
      <div className="explore__stage">
        {webgl && <SystemScene className="absolute inset-0" />}
        {webgl === false && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 h-full w-full object-cover" src="/posters/system.webp" alt="Rendered overview of the Vesper system: an orange dwarf star with five planets on their orbits." loading="lazy" />
        )}
        {webgl && (
          <div className="sys-labels" aria-hidden>
            {SYSTEM.map((x) => (
              <span key={x.id} className="sys-label label" data-target={x.target ? 'true' : undefined}
                ref={(el) => { if (el) systemBus.labels.set(x.id, el); else systemBus.labels.delete(x.id); }}>
                {x.name}{x.target && <i> · destination</i>}
              </span>
            ))}
          </div>
        )}
      </div>

      <header className="explore__head">
        <p className="label text-faint"><span className="idx text-gold">04</span> — Explore the Unknown</p>
        <h2 id="explore-title" className="display text-h3">Five worlds around <span className="serif-word text-atmo">Vesper</span></h2>
      </header>

      <nav className="explore__rail" aria-label="Planets of the Vesper system">
        <ol>
          {SYSTEM.map((x, i) => (
            <li key={x.id}>
              <button type="button" aria-pressed={selected === x.id} onClick={() => ui.set({ planet: selected === x.id ? null : x.id })}>
                <span className="idx text-micro">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-lead font-medium">{x.name}</span>
                <span className="label text-faint">{x.designation}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-ghost explore__overview" aria-pressed={selected === null} onClick={() => ui.set({ planet: null })}>System overview</button>
      </nav>

      <aside className="explore__panel" aria-live="polite">
        {p ? (
          <>
            <p className="label text-gold">{p.designation}{p.target ? ' · Destination' : ''}</p>
            <h3 className="display text-h3">{p.name}</h3>
            <p className="text-dim measure">{p.summary}</p>
            <dl className="explore__data">
              <div><dt className="label text-faint">Orbit</dt><dd className="num">{p.orbitAU} AU</dd></div>
              <div><dt className="label text-faint">Year</dt><dd className="num">{p.period}</dd></div>
              <div><dt className="label text-faint">Surface</dt><dd className="num">{p.temp}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <p className="label text-gold">Vesper · K2 dwarf</p>
            <h3 className="display text-h4">An orange star, cooler than ours, with five known worlds.</h3>
            <p className="text-dim measure">Select a planet to fly to it. Calder sits inside the temperate zone, where water could stay liquid.</p>
          </>
        )}
        <p className="label text-faint explore__note">Modelled values · design fiction</p>
      </aside>
    </section>
  );
}
