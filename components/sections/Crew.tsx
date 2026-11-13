'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { CREW, type CrewMember } from '@/lib/mission';
import { ui } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Crew() {
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<CrewMember | null>(null);
  const reduced = ui.use((s) => s.reduced);
  const coarse = ui.use((s) => s.coarse);

  useGSAP(() => {
    // iris: the paper dossier opens out of a point at the top of the section
    gsap.fromTo('.crew__bg', { clipPath: 'circle(0% at 50% 0%)' }, {
      clipPath: 'circle(150% at 50% 0%)', ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: reduced ? 'top bottom' : 'top 15%', scrub: true },
    });
    if (!reduced) {
      gsap.from('.crew__row', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.crew__list', start: 'top 80%' } });
      gsap.from('.crew__title .line > span', { yPercent: 110, stagger: 0.1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.crew__title', start: 'top 85%' } });
    }
  }, { scope: root, dependencies: [reduced] });

  // floating portrait follows the cursor with lag (fine pointers only)
  useEffect(() => {
    if (coarse || !preview.current) return;
    const el = preview.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const list = root.current?.querySelector('.crew__list') as HTMLElement | null;
    const move = (e: PointerEvent) => { xTo(e.clientX + 32); yTo(e.clientY - 180); };
    list?.addEventListener('pointermove', move);
    return () => list?.removeEventListener('pointermove', move);
  }, [coarse]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <section id="crew" ref={root} className="crew" aria-labelledby="crew-title">
      <div className="crew__bg" aria-hidden />
      <div className="crew__inner">
        <header className="crew__head">
          <p className="label"><span className="idx crew__gold">05</span> — The Crew</p>
          <h2 id="crew-title" className="crew__title display text-h2">
            <span className="line"><span>Four people.</span></span>
            <span className="line"><span><span className="serif-word">Twenty-two</span> years.</span></span>
          </h2>
          <p className="crew__lede measure">They sleep in turns. One of them is always awake, watching a star get brighter.</p>
        </header>

        <ol className="crew__list" onPointerLeave={() => setHover(null)}>
          {CREW.map((c, i) => (
            <li key={c.id} className="crew__row" data-active={hover === c.id}>
              <button type="button" className="crew__btn" onPointerEnter={() => setHover(c.id)} onFocus={() => setHover(c.id)} onBlur={() => setHover(null)} onClick={() => setOpen(c)} aria-haspopup="dialog">
                <span className="idx crew__idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="crew__thumb" aria-hidden><Image src={c.img} alt="" width={88} height={110} sizes="88px" /></span>
                <span className="crew__name display text-h3">{c.name}</span>
                <span className="crew__role">{c.role}</span>
                <span className="crew__call label">{c.callsign}</span>
                <span className="crew__open label">Read file <span aria-hidden>→</span></span>
              </button>
            </li>
          ))}
        </ol>
        <p className="crew__note label">Fictional crew · portraits are generated imagery</p>
      </div>

      {!coarse && (
        <div ref={preview} className="crew__preview" data-show={!!hover} aria-hidden>
          {CREW.map((c) => (
            <Image key={c.id} src={c.img} alt="" width={280} height={350} sizes="280px" data-on={hover === c.id} />
          ))}
        </div>
      )}

      <dialog ref={dialog} className="crew__dialog" aria-labelledby="crew-dialog-title" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}>
        {open && (
          <article className="crew__file">
            <div className="crew__file-img"><Image src={open.img} alt={`Portrait of ${open.name}, ${open.role}`} width={440} height={550} sizes="(max-width: 760px) 100vw, 440px" /></div>
            <div className="crew__file-body">
              <p className="label crew__gold">{open.callsign} · {open.role}</p>
              <h3 id="crew-dialog-title" className="display text-h3">{open.name}</h3>
              <blockquote className="serif-word text-h4">“{open.quote}”</blockquote>
              <p className="crew__bio">{open.bio}</p>
              <dl className="crew__stats">
                <div><dt className="label">Home</dt><dd>{open.origin}</dd></div>
                {open.stats.map((s) => (<div key={s.k}><dt className="label">{s.k}</dt><dd className="num">{s.v}</dd></div>))}
              </dl>
              <button type="button" className="btn-ghost crew__close" onClick={() => setOpen(null)} autoFocus>Close file</button>
            </div>
          </article>
        )}
      </dialog>
    </section>
  );
}
