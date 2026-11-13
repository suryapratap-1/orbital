'use client';
import { NAV, SITE } from '@/lib/mission';
import { scrollToId } from '@/lib/scroll';
import { Wordmark } from '../ui/Nav';
import RollText from '../ui/RollText';

export default function Footer() {
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToId(id); };
  return (
    <footer className="footer" aria-labelledby="footer-title">
      <h2 id="footer-title" className="footer__mark display">
        <span>Beyond the</span> <span className="serif-word">known</span><span className="footer__dot">.</span>
      </h2>
      <div className="footer__line signal-line" aria-hidden />
      <div className="footer__grid">
        <div className="footer__brand">
          <Wordmark />
          <p className="text-small text-dim measure">Expedition Vesper is ORBITAL&apos;s first interstellar mission: four crew, one ship, 6.2 light-years.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="footer__links">
            {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} onClick={go(n.id)}><RollText>{n.label}</RollText></a></li>)}
            <li><a href="#pioneer" onClick={go('pioneer')} className="text-gold"><RollText>Become a Pioneer</RollText></a></li>
          </ul>
        </nav>
        <div className="footer__meta">
          <a href="#top" onClick={go('top')} className="btn-ghost"><RollText>Back to orbit</RollText><span aria-hidden>↑</span></a>
          <p className="label text-faint">© 2026 ORBITAL · Design fiction</p>
        </div>
      </div>
      <p className="footer__disclaimer text-micro text-faint">{SITE.disclaimer}</p>
    </footer>
  );
}
