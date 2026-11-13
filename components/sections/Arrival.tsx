'use client';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { frame, ui } from '@/lib/store';
import { scrollToId } from '@/lib/scroll';
import RollText from '../ui/RollText';

const HeroScene = dynamic(() => import('@/three/scenes/HeroScene'), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Arrival() {
  const root = useRef<HTMLElement>(null);
  const webgl = ui.use((s) => s.webgl);
  const loaded = ui.use((s) => s.loaded);
  const reduced = ui.use((s) => s.reduced);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => { frame.hero = self.progress; },
    });
    if (!reduced) {
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true } })
        .to('.hero__wordmark', { yPercent: -38, scale: 0.92, ease: 'none' }, 0)
        .to('.hero__wordmark', { autoAlpha: 0, ease: 'none', duration: 0.35 }, 0.55)
        .to('.hero__intro', { autoAlpha: 0, y: -40, ease: 'none', duration: 0.3 }, 0.05)
        .fromTo('.hero__second', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.3 }, 0.55);
    }
    return () => st.kill();
  }, { scope: root, dependencies: [reduced] });

  // entrance after the loader: wordmark rises out of the planet, copy follows
  useGSAP(() => {
    if (!loaded) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.hero__wordmark span', { yPercent: reduced ? 0 : 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: reduced ? 0.01 : 2.4, stagger: 0.06 }, 0.2)
      .fromTo('.hero__intro > *', { y: reduced ? 0 : 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, stagger: 0.09 }, 0.9);
  }, { scope: root, dependencies: [loaded] });

  return (
    <section id="top" ref={root} className="hero" aria-labelledby="hero-title">
      {/* back layer: below the WebGL canvas so the planet eclipses the wordmark */}
      <div className="hero__back">
        <div className="hero__wordmark display" aria-hidden>
          {'ORBITAL'.split('').map((c, i) => <span key={i}>{c}</span>)}
        </div>
        {webgl && <HeroScene />}
        {webgl === false && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="absolute inset-0 h-full w-full object-cover" src="/posters/hero.webp" alt="Rendered view of the planet Calder at dawn, its thin blue atmosphere lit from behind." />
        )}
        <div className="hero__fade" aria-hidden />
      </div>

      {/* front layer: above the canvas */}
      <div className="hero__front">
        <p className="hero__stamp label">
          <span className="text-faint">Announcement 01</span>
          <span className="text-dim">Expedition Vesper</span>
        </p>

        <div className="hero__intro">
          <h1 id="hero-title" className="display text-h4 max-w-[18ch]">
            <span className="sr-only">ORBITAL. </span>
            The first crewed voyage to <span className="serif-word text-atmo">another star</span>.
          </h1>
          <p className="text-dim measure">ORION-01 departs in 2046 for Calder, a candidate ocean world 6.2 light-years away. This is the plan, in the open.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#pioneer" className="btn-gold" onClick={(e) => { e.preventDefault(); scrollToId('pioneer'); }}><RollText>Become a Pioneer</RollText><span aria-hidden>↗</span></a>
            <a href="#mission" className="btn-ghost" onClick={(e) => { e.preventDefault(); scrollToId('mission'); }}><RollText>Read the mission</RollText></a>
          </div>
        </div>

        <div className="hero__second" aria-hidden={false}>
          <p className="label text-gold">Calder · Vesper c</p>
          <p className="display text-h4 measure-head">A world of open water, maybe. Ice at both poles, certainly. Nobody has seen it closer than a single pixel.</p>
        </div>

        <div className="hero__meta">
          <span className="label text-faint">Rendered view · not an observation</span>
          <span className="hero__scroll label text-dim"><i aria-hidden /> Scroll to bring the signal home</span>
        </div>
      </div>
    </section>
  );
}
