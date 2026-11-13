'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PIONEER_ROLES, VESPER_LY } from '@/lib/mission';
import { pioneerSchema, toFieldErrors, type FieldErrors, type PioneerInput, type PioneerResponse } from '@/lib/pioneer';
import { ui } from '@/lib/store';
import RollText from '../ui/RollText';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Status = 'idle' | 'sending' | 'sent' | 'error';
const EMPTY: PioneerInput = { fullName: '', email: '', country: '', role: '' as PioneerInput['role'], message: '', updates: false, consent: false as unknown as true, website: '' };
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Pioneer() {
  const root = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<PioneerInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PioneerInput, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [receipt, setReceipt] = useState<Extract<PioneerResponse, { ok: true }> | null>(null);
  const reduced = ui.use((s) => s.reduced);
  const uid = useId();
  const receiptRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduced) return;
    gsap.from('.pioneer__title .line > span', { yPercent: 110, stagger: 0.12, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 60%' } });
  }, { scope: root, dependencies: [reduced] });

  useEffect(() => { if (status === 'sent') receiptRef.current?.focus(); }, [status]);

  const validate = (v: PioneerInput) => {
    const r = pioneerSchema.safeParse(v);
    return r.success ? {} : toFieldErrors(r.error);
  };
  const set = <K extends keyof PioneerInput>(k: K, val: PioneerInput[K]) => {
    const next = { ...values, [k]: val };
    setValues(next);
    if (touched[k]) setErrors((e) => ({ ...e, [k]: validate(next)[k] }));
  };
  const blur = (k: keyof PioneerInput) => () => { setTouched((t) => ({ ...t, [k]: true })); setErrors((e) => ({ ...e, [k]: validate(values)[k] })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    const errs = validate(values);
    setTouched({ fullName: true, email: true, country: true, role: true, message: true, consent: true });
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) {
      // focus the first invalid field once React has rendered the error state
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setStatus('sending');
    const started = performance.now();
    try {
      const res = await fetch('/api/pioneers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = (await res.json()) as PioneerResponse;
      // let the pulse finish its run before revealing the receipt
      const wait = Math.max(0, (reduced ? 0 : 1600) - (performance.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      if (data.ok) { setReceipt(data); setStatus('sent'); }
      else {
        setStatus('error'); setServerError(data.error);
        if (data.fieldErrors) { setErrors(data.fieldErrors); setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0); }
      }
    } catch {
      setStatus('error');
      setServerError('No connection. Your details were not sent, so please check your network and try again.');
    }
  };

  const reset = () => { setValues(EMPTY); setErrors({}); setTouched({}); setReceipt(null); setStatus('idle'); setServerError(''); };
  const err = (k: keyof PioneerInput) => (touched[k] ? errors[k] : undefined);
  const fid = (k: string) => `${uid}-${k}`;
  const initials = values.fullName.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || 'YOU';

  return (
    <section id="pioneer" ref={root} className="pioneer" aria-labelledby="pioneer-title" data-status={status}>
      <div className="pioneer__intro">
        <p className="label text-faint"><span className="idx text-gold">08</span> — Become a Pioneer</p>
        <h2 id="pioneer-title" className="pioneer__title display text-h2">
          <span className="line"><span>Signal received.</span></span>
          <span className="line"><span>Now <span className="serif-word text-gold">answer</span> it.</span></span>
        </h2>
        <p className="text-dim measure">Add your name to the manifest. Every name is carried on ORION-01&apos;s memory core and read out over the Lantern chain when the ship arrives.</p>
        <ul className="pioneer__perks">
          <li><span className="idx text-gold">01</span> A signal ID, yours for the whole mission</li>
          <li><span className="idx text-gold">02</span> Optional updates at each milestone</li>
          <li><span className="idx text-gold">03</span> Your message, 140 characters, sent to the crew</li>
        </ul>
      </div>

      <div className="pioneer__panel">
        {/* the transmission line — the concept device carries the reply */}
        <div className="tx" aria-hidden>
          <span className="tx__end label">Earth</span>
          <span className="tx__line"><span className="tx__pulse">{initials}</span></span>
          <span className="tx__end label">Vesper · <span className="num">{VESPER_LY} ly</span></span>
        </div>

        {status === 'sent' && receipt ? (
          <div ref={receiptRef} className="receipt" tabIndex={-1} role="status" aria-live="polite">
            <p className="label text-gold">Transmission logged</p>
            <h3 className="display text-h3">Welcome aboard, {receipt.name.split(' ')[0]}.</h3>
            <dl className="receipt__grid">
              <div><dt className="label text-faint">Signal ID</dt><dd className="num text-lead">{receipt.signalId}</dd></div>
              <div><dt className="label text-faint">Logged</dt><dd className="num">{fmt(receipt.sentAt)}</dd></div>
              <div><dt className="label text-faint">Would reach Vesper</dt><dd className="num">{fmt(receipt.arrivesAt)}</dd></div>
              <div><dt className="label text-faint">Pioneer no.</dt><dd className="num">{receipt.count.toLocaleString('en-GB')}</dd></div>
            </dl>
            <p className="text-small text-dim">Travelling at the speed of light, a message sent today would take {VESPER_LY} years to arrive. We&apos;ll write to you at each milestone if you opted in.</p>
            <button type="button" className="btn-ghost" onClick={reset}><RollText>Register someone else</RollText></button>
          </div>
        ) : (
          <form ref={form} className="pform" noValidate onSubmit={submit} aria-describedby={serverError ? fid('server') : undefined}>
            <div className="pform__grid">
              <Field id={fid('name')} label="Full name" error={err('fullName')}>
                <input id={fid('name')} name="name" autoComplete="name" value={values.fullName} onChange={(e) => set('fullName', e.target.value)} onBlur={blur('fullName')}
                  aria-invalid={!!err('fullName')} aria-describedby={err('fullName') ? fid('name-err') : undefined} required maxLength={80} />
              </Field>
              <Field id={fid('email')} label="Email" error={err('email')}>
                <input id={fid('email')} name="email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={(e) => set('email', e.target.value)} onBlur={blur('email')}
                  aria-invalid={!!err('email')} aria-describedby={err('email') ? fid('email-err') : undefined} required maxLength={254} />
              </Field>
              <Field id={fid('country')} label="Country or region" error={err('country')}>
                <input id={fid('country')} name="country" autoComplete="country-name" value={values.country} onChange={(e) => set('country', e.target.value)} onBlur={blur('country')}
                  aria-invalid={!!err('country')} aria-describedby={err('country') ? fid('country-err') : undefined} required maxLength={60} />
              </Field>
              <Field id={fid('role')} label="I am a…" error={err('role')}>
                <select id={fid('role')} name="role" value={values.role} onChange={(e) => set('role', e.target.value as PioneerInput['role'])} onBlur={blur('role')}
                  aria-invalid={!!err('role')} aria-describedby={err('role') ? fid('role-err') : undefined} required>
                  <option value="" disabled>Choose one</option>
                  {PIONEER_ROLES.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
                </select>
              </Field>
              <Field id={fid('msg')} label="Message to the crew (optional)" error={err('message')} wide counter={`${(values.message ?? '').length}/140`}>
                <textarea id={fid('msg')} name="message" rows={2} value={values.message} onChange={(e) => set('message', e.target.value)} onBlur={blur('message')} maxLength={140}
                  aria-invalid={!!err('message')} aria-describedby={err('message') ? fid('msg-err') : undefined} placeholder="Tell them what to look for." />
              </Field>
            </div>
            {/* honeypot */}
            <input className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={values.website} onChange={(e) => set('website', e.target.value)} />

            <div className="pform__checks">
              <label className="check">
                <input type="checkbox" checked={!!values.updates} onChange={(e) => set('updates', e.target.checked)} />
                <span className="check__box" aria-hidden /> <span className="text-small">Send me an update at each mission milestone.</span>
              </label>
              <label className="check" data-invalid={!!err('consent')}>
                <input type="checkbox" checked={!!values.consent} onChange={(e) => set('consent', e.target.checked as true)} onBlur={blur('consent')}
                  aria-invalid={!!err('consent')} aria-describedby={err('consent') ? fid('consent-err') : undefined} required />
                <span className="check__box" aria-hidden /> <span className="text-small">I agree that ORBITAL may store my name, email and country to run the Pioneer manifest. I can ask for deletion at any time.</span>
              </label>
              {err('consent') && <p id={fid('consent-err')} className="field__err text-small">{err('consent')}</p>}
            </div>

            {serverError && <p id={fid('server')} className="pform__server text-small" role="alert">{serverError}</p>}

            <button type="submit" className="btn-gold pform__submit" disabled={status === 'sending'} aria-busy={status === 'sending'}>
              {status === 'sending' ? <span>Transmitting…</span> : <RollText>Transmit my name</RollText>}
              <span aria-hidden>↗</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ id, label, error, children, wide, counter }: { id: string; label: string; error?: string; children: React.ReactNode; wide?: boolean; counter?: string }) {
  return (
    <div className="field" data-wide={wide} data-invalid={!!error}>
      <label htmlFor={id} className="field__label label">{label}{counter && <span className="num field__count">{counter}</span>}</label>
      {children}
      {error && <p id={`${id}-err`} className="field__err text-small">{error}</p>}
    </div>
  );
}
