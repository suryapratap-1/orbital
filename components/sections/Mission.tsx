'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MISSION, VESPER_LY } from '@/lib/mission';
import { ui } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// log-scale position of a distance on the ruler (Earth → Vesper)
const LMIN = Math.log10(2e-8), LMAX = Math.log10(VESPER_LY);
const pos = (ly: number) => (Math.log10(ly) - LMIN) / (LMAX - LMIN);

export default function Mission() {
  const root = useRef<HTMLElement>(null);
  const reduced = ui.use((s) => s.reduced);

  useGSAP(() => {
    if (reduced) return;
    // statement: words light up as they are read
    gsap.fromTo('.mission__statement .w', { opacity: 0.16 }, {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: '.mission__statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
    // the giant distance rises out of a mask
    gsap.from('.mission__big .digit', { yPercent: 105, stagger: 0.06, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.mission__big', start: 'top 85%' } });
    // the ruler: a pulse travels Earth → Vesper, ticks light as it passes them
    const ticks = gsap.utils.toArray<HTMLElement>('.ruler__tick');
    ScrollTrigger.create({
      trigger: '.ruler', start: 'top 85%', end: 'bottom 35%', scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        root.current?.style.setProperty('--ruler', String(p));
        ticks.forEach((t) => t.classList.toggle('is-passed', Number(t.dataset.p) <= p + 0.001));
      },
    });
    gsap.from('.objective', { y: 48, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.objectives', start: 'top 80%' } });
  }, { scope: root, dependencies: [reduced] });

  return (
    <section id="mission" ref={root} className="mission" aria-labelledby="mission-title" style={{ ['--ruler' as string]: reduced ? 1 : 0 }}>
      <div className="mission__head">
        <p className="label text-faint"><span className="idx text-gold">02</span> — The Mission</p>
        <h2 id="mission-title" className="sr-only">The Mission: Expedition Vesper</h2>
        <div className="mission__big display" aria-label={`${VESPER_LY} light-years to Vesper`}>
          <span className="mask" aria-hidden>{'6.20'.split('').map((d, i) => <span key={i} className="digit">{d}</span>)}</span>
          <span className="mission__unit" aria-hidden><span className="serif-word">light-years</span><span className="label text-faint">to the nearest promising world</span></span>
        </div>
      </div>

      <p className="mission__statement display text-h4">
        {MISSION.statement.split(' ').map((w, i) => <span key={i} className="w">{w} </span>)}
      </p>

      <figure className="ruler" aria-label="Logarithmic distance scale from Earth to Vesper, with one-way signal delay at each waypoint">
        <div className="ruler__line" aria-hidden><span className="ruler__fill" /><span className="ruler__pulse" /></div>
        <ol className="ruler__ticks">
          <li className="ruler__tick is-passed" data-p="0" style={{ left: '0%' }}>
            <span className="label">Earth</span><span className="idx text-micro">0 s</span>
          </li>
          {MISSION.ruler.map((r) => {
            const p = pos(r.ly);
            return (
              <li key={r.name} className="ruler__tick" data-p={p.toFixed(4)} style={{ left: `${(p * 100).toFixed(2)}%` }}>
                <span className="label">{r.name}</span><span className="idx text-micro">{r.delay}</span>
              </li>
            );
          })}
        </ol>
        <figcaption className="label text-faint">Log scale · signal delay, one way · Vesper distance is design fiction</figcaption>
      </figure>

      <div className="mission__grid">
        <dl className="facts">
          {MISSION.facts.map((f) => (
            <div key={f.k} className="facts__row"><dt className="label text-faint">{f.k}</dt><dd className="text-small">{f.v}</dd></div>
          ))}
        </dl>
        <ol className="objectives" aria-label="Mission objectives">
          {MISSION.objectives.map((o) => (
            <li key={o.n} className="objective">
              <span className="idx objective__n">{o.n}</span>
              <h3 className="text-lead font-medium">{o.title}</h3>
              <p className="text-dim text-small measure">{o.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
