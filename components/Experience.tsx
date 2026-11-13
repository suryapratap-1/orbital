'use client';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { completeTask, frame, ui } from '@/lib/store';
import { detectTier, detectWebGL } from '@/lib/capabilities';
import { scrollToId, setLenis } from '@/lib/scroll';
import Loader from './ui/Loader';

const Stage = dynamic(() => import('@/three/Stage'), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

/** Client shell: capability detection, smooth scroll, the shared WebGL stage and the loader. */
export default function Experience({ children }: { children: React.ReactNode }) {
  const webgl = ui.use((s) => s.webgl);
  const reduced = ui.use((s) => s.reduced);
  const loaded = ui.use((s) => s.loaded);

  // 1. capabilities
  useEffect(() => {
    const gl = detectWebGL();
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)').matches;
    const reducedQ = new URLSearchParams(location.search).has('reduced');
    ui.set({ webgl: gl, reduced: mq.matches || reducedQ, tier: detectTier(), coarse });
    (window as unknown as { __orbital: unknown }).__orbital = { ui, frame, t0: performance.now() };
    const root = document.documentElement;
    root.classList.toggle('no-webgl', !gl);
    root.classList.toggle('reduced', mq.matches || reducedQ);
    const onMq = () => { ui.set({ reduced: mq.matches }); root.classList.toggle('reduced', mq.matches); };
    mq.addEventListener('change', onMq);
    if (!gl) { completeTask('gl'); completeTask('hero'); }
    document.fonts.ready.then(() => completeTask('fonts'));
    const safety = window.setTimeout(() => ui.set({ pending: [] }), 12000);
    return () => { mq.removeEventListener('change', onMq); window.clearTimeout(safety); };
  }, []);

  // 2. smooth scroll + one ticker for Lenis, ScrollTrigger and per-frame values
  useEffect(() => {
    if (webgl === null) return;
    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      setLenis(lenis);
      if (!ui.get().loaded) lenis.stop();
    }
    const raf = (t: number) => {
      lenis?.raf(t * 1000);
      frame.velocity = lenis ? lenis.velocity : 0;
      const end = document.getElementById('pioneer');
      const max = end ? end.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25 : document.documentElement.scrollHeight - innerHeight;
      frame.page = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const onRefresh = () => lenis?.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    const onMove = (e: PointerEvent) => {
      frame.pointerX = (e.clientX / innerWidth) * 2 - 1;
      frame.pointerY = -((e.clientY / innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      gsap.ticker.remove(raf);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      window.removeEventListener('pointermove', onMove);
      lenis?.destroy();
      setLenis(null);
    };
  }, [webgl, reduced]);

  // 3. after the loader: start scrolling, honour ?shot=<section id> for review screenshots
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.remove('is-loading');
    import('@/lib/scroll').then(({ getLenis }) => getLenis()?.start());
    ScrollTrigger.refresh();
    const shot = new URLSearchParams(location.search).get('shot');
    if (shot) setTimeout(() => { ScrollTrigger.refresh(); scrollToId(shot, { immediate: true }); }, 300);
  }, [loaded]);

  return (
    <>
      {webgl && <Stage />}
      {children}
      <Loader />
      <div className="grain" aria-hidden />
    </>
  );
}
