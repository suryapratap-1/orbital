'use client';
import { useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/mission';
import { scrollToId } from '@/lib/scroll';
import RollText from './RollText';
import SignalHud from './SignalHud';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r="3.2" fill="var(--color-star)" />
        <ellipse cx="9" cy="9" rx="8.2" ry="3.4" fill="none" stroke="var(--color-gold)" strokeWidth="1" transform="rotate(-24 9 9)" />
      </svg>
      <span className="display text-small tracking-[0.2em] font-medium">ORBITAL</span>
    </span>
  );
}

export default function Nav() {
  const [active, setActive] = useState<string>('');
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // track the active chapter
  useEffect(() => {
    const ids = [...NAV.map((n) => n.id), 'pioneer'];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    // the nav inverts while it sits over the light Crew dossier
    const crew = document.getElementById('crew');
    const io2 = new IntersectionObserver(([e]) => document.documentElement.toggleAttribute('data-nav-light', e.isIntersecting), { rootMargin: '0px 0px -92% 0px' });
    if (crew) io2.observe(crew);
    els.forEach((el) => io.observe(el));
    return () => { io.disconnect(); io2.disconnect(); };
  }, []);

  // mobile menu: Escape closes, focus is trapped and restored
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const btn = menuBtn.current;
    panel.current?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>('a,button')];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; (prev ?? btn)?.focus(); };
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); setOpen(false); scrollToId(id); };

  return (
    <header className="nav">
      <a href="#top" onClick={go('top')} className="nav__brand" aria-label="ORBITAL — back to top"><Wordmark /></a>
      <SignalHud />
      <nav aria-label="Sections" className="nav__links">
        {NAV.map((n, i) => (
          <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'true' : undefined} className="nav__link">
            <span className="idx nav__idx" aria-hidden>{String(i + 2).padStart(2, '0')}</span>
            <RollText>{n.label}</RollText>
          </a>
        ))}
      </nav>
      <a href="#pioneer" onClick={go('pioneer')} className="btn-gold nav__cta"><RollText>Become a Pioneer</RollText></a>
      <button ref={menuBtn} type="button" className="nav__menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
        <span className="label">{open ? 'Close' : 'Menu'}</span>
        <span className="nav__burger" data-open={open} aria-hidden><i /><i /></span>
      </button>
      <div id="mobile-menu" ref={panel} className="nav__panel" data-open={open} aria-hidden={!open} inert={!open}>
        <ol>
          {[...NAV, { id: 'pioneer', label: 'Become a Pioneer' }].map((n, i) => (
            <li key={n.id} style={{ transitionDelay: open ? `${0.08 + i * 0.04}s` : '0s' }}>
              <a href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'true' : undefined}>
                <span className="idx text-small text-faint">{String(i + 2).padStart(2, '0')}</span>
                <span className="display text-h3">{n.label}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="label text-faint">Signal delay to Vesper · <span className="num">6.20 yr</span></p>
      </div>
    </header>
  );
}
