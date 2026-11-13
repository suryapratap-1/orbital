import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="lost">
      <p className="label text-faint">Signal lost · 404</p>
      <h1 className="display text-h2">This coordinate is <span className="serif-word text-atmo">empty</span> space.</h1>
      <p className="text-dim measure">Nothing has been charted here yet. The mission is back at home orbit.</p>
      <Link href="/" className="btn-gold">Return to orbit</Link>
    </main>
  );
}
