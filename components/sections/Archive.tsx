'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ARCHIVE } from '@/lib/mission';
import { ui } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// three columns, each drifting at its own depth
const COLS = [[0, 3, 6], [1, 4], [2, 5, 7]];
const SPEED = [-8, 10, -14];

export default function Archive() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const reduced = ui.use((s) => s.reduced);
  const coarse = ui.use((s) => s.coarse);

  useGSAP(() => {
    if (reduced) return;
    gsap.utils.toArray<HTMLElement>('.arc__col').forEach((col, i) => {
      gsap.fromTo(col, { yPercent: -SPEED[i] / 2 }, { yPercent: SPEED[i] / 2, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray<HTMLElement>('.arc__item').forEach((it) => {
      gsap.fromTo(it.querySelector('.arc__frame'), { clipPath: 'inset(18% 8% 18% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 88%' } });
    });
  }, { scope: root, dependencies: [reduced] });

  // "View" badge cursor over images
  useEffect(() => {
    if (coarse || !cursor.current || !root.current) return;
    const el = cursor.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
    const grid = root.current.querySelector('.arc__grid') as HTMLElement;
    const move = (e: PointerEvent) => { xTo(e.clientX); yTo(e.clientY); el.dataset.show = (e.target as HTMLElement).closest('.arc__btn') ? 'true' : 'false'; };
    const leave = () => { el.dataset.show = 'false'; };
    grid.addEventListener('pointermove', move); grid.addEventListener('pointerleave', leave);
    return () => { grid.removeEventListener('pointermove', move); grid.removeEventListener('pointerleave', leave); };
  }, [coarse]);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const step = useCallback((dir: number) => setIndex((i) => (i === null ? i : (i + dir + ARCHIVE.length) % ARCHIVE.length)), []);
  const item = index !== null ? ARCHIVE[index] : null;

  return (
    <section id="archive" ref={root} className="archive" aria-labelledby="archive-title">
      <header className="archive__head">
        <p className="label text-faint"><span className="idx text-gold">07</span> — Mission Archive</p>
        <h2 id="archive-title" className="display text-h2">The work, <span className="serif-word text-atmo">so far</span>.</h2>
        <p className="text-dim measure">Frames from the build-up to departure. They are concept imagery, generated for this design fiction.</p>
      </header>

      <div className="arc__grid">
        {COLS.map((col, ci) => (
          <ul key={ci} className="arc__col" role="list">
            {col.map((i) => {
              const a = ARCHIVE[i];
              return (
                <li key={a.code} className="arc__item">
                  <button type="button" className="arc__btn" onClick={() => setIndex(i)} aria-label={`Open ${a.title}`}>
                    <span className="arc__frame">
                      <Image src={a.src} alt={a.caption} width={a.w} height={a.h} sizes="(max-width: 760px) 100vw, 33vw" />
                    </span>
                  </button>
                  <div className="arc__cap">
                    <span className="idx label text-gold">{a.code}</span>
                    <span className="text-small">{a.title}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      {!coarse && <div ref={cursor} className="arc__cursor label" data-show="false" aria-hidden>View</div>}

      <dialog ref={dialog} className="lightbox" aria-label="Archive image viewer" onClose={() => setIndex(null)}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }}
        onClick={(e) => { if (e.target === dialog.current) setIndex(null); }}>
        {item && (
          <figure className="lightbox__fig">
            <Image key={item.src} src={item.src} alt={item.caption} width={item.w} height={item.h} sizes="90vw" className="lightbox__img" />
            <figcaption className="lightbox__cap">
              <span className="idx label text-gold">{item.code}</span>
              <span className="text-lead font-medium">{item.title}</span>
              <span className="text-small text-dim">{item.caption} Concept imagery.</span>
              <span className="idx text-micro text-faint lightbox__count">{String(index! + 1).padStart(2, '0')} / {String(ARCHIVE.length).padStart(2, '0')}</span>
            </figcaption>
            <div className="lightbox__nav">
              <button type="button" className="btn-ghost icon" onClick={() => step(-1)} aria-label="Previous image">←</button>
              <button type="button" className="btn-ghost icon" onClick={() => step(1)} aria-label="Next image">→</button>
              <button type="button" className="btn-ghost" onClick={() => setIndex(null)} autoFocus>Close</button>
            </div>
          </figure>
        )}
      </dialog>
    </section>
  );
}
