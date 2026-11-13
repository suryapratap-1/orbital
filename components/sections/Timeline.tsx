'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TIMELINE } from '@/lib/mission';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEP = 440, PAD = 260, H = 620, MID = 330;
const W = PAD * 2 + STEP * (TIMELINE.length - 1);
const xs = TIMELINE.map((_, i) => PAD + i * STEP);
// trajectory: climbs out of Earth, coasts high, descends into Vesper, then the signal returns along the bottom
const ys = TIMELINE.map((m, i) => MID + 70 - Math.sin((i / (TIMELINE.length - 2)) * Math.PI) * 150 + (m.year === '2074' ? 120 : 0));

function smoothPath(px: number[], py: number[]) {
  let d = `M0 ${py[0] + 40} C ${px[0] * 0.5} ${py[0] + 40}, ${px[0] * 0.6} ${py[0]}, ${px[0]} ${py[0]}`;
  for (let i = 0; i < px.length - 1; i++) {
    const x0 = px[Math.max(0, i - 1)], y0 = py[Math.max(0, i - 1)];
    const x1 = px[i], y1 = py[i], x2 = px[i + 1], y2 = py[i + 1];
    const x3 = px[Math.min(px.length - 1, i + 2)], y3 = py[Math.min(px.length - 1, i + 2)];
    const t = 0.5;
    d += ` C ${x1 + ((x2 - x0) / 6) * t * 2} ${y1 + ((y2 - y0) / 6) * t * 2}, ${x2 - ((x3 - x1) / 6) * t * 2} ${y2 - ((y3 - y1) / 6) * t * 2}, ${x2} ${y2}`;
  }
  const lx = px[px.length - 1], ly = py[py.length - 1];
  return d + ` C ${lx + 120} ${ly}, ${W - 60} ${ly}, ${W} ${ly}`;
}
const PATH = smoothPath(xs, ys);

export default function Timeline() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const probe = useRef<SVGGElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const p = path.current!, len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      const cards = gsap.utils.toArray<HTMLElement>('.ms');
      const update = (prog: number) => {
        p.style.strokeDashoffset = String(len * (1 - prog));
        const pt = p.getPointAtLength(len * prog);
        probe.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        const xNow = pt.x;
        cards.forEach((c, i) => c.classList.toggle('is-on', xs[i] <= xNow + 2));
      };
      const tween = gsap.to(track.current, {
        x: () => -(W - window.innerWidth), ease: 'none',
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: () => `+=${W - window.innerWidth + window.innerHeight * 0.5}`,
          pin: '.timeline__pin', scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => update(Math.min(1, self.progress * 1.06)),
        },
      });
      update(0);
      return () => { tween.scrollTrigger?.kill(); tween.kill(); p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; };
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section id="timeline" ref={root} className="timeline" aria-labelledby="timeline-title">
      <div className="timeline__pin">
        <header className="timeline__head">
          <p className="label text-faint"><span className="idx text-gold">06</span> — Mission Timeline</p>
          <h2 id="timeline-title" className="display text-h3">Thirty-six years, <span className="serif-word text-atmo">one</span> trajectory.</h2>
        </header>
        <div className="timeline__viewport">
          <div ref={track} className="timeline__track" style={{ width: W, height: H }}>
            <svg className="timeline__svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
              <path d={PATH} className="timeline__ghost" />
              <path ref={path} d={PATH} className="timeline__path" />
              {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="4" className="timeline__node" />)}
              <g ref={probe} transform={`translate(${xs[0]} ${ys[0]})`}>
                <circle r="16" className="timeline__halo" /><circle r="5" className="timeline__probe" />
              </g>
            </svg>
            <ol className="timeline__list">
              {TIMELINE.map((m, i) => {
                const up = i % 2 === 0;
                return (
                  <li key={m.year + m.title} className={`ms ${up ? 'ms--up' : 'ms--down'}`} data-phase={m.phase}
                    style={{ left: xs[i], top: up ? ys[i] - 28 : ys[i] + 28 }}>
                    <span className="ms__phase label">{m.phase}</span>
                    <span className="ms__year display text-h3">{m.year}</span>
                    <h3 className="ms__title text-lead font-medium">{m.title}</h3>
                    <p className="ms__body text-small text-dim">{m.body}</p>
                    <span className="ms__delay label">Signal delay · {m.delay}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
