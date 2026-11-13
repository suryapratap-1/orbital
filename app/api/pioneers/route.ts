import { randomBytes } from 'node:crypto';
import { getPool } from '@/lib/db';
import { pioneerSchema, toFieldErrors, type PioneerResponse } from '@/lib/pioneer';
import { arrivalDate } from '@/lib/signal';

// Small in-memory rate limit (per server instance): 5 submissions / 10 min / IP.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function signalId(): string {
  const b = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return `VSP-${s.slice(0, 4)}-${s.slice(4)}`;
}

const json = (body: PioneerResponse, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return json({ ok: false, error: 'Cross-origin requests are not accepted.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false, error: 'Expected JSON.' }, 415);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  if (limited(ip)) return json({ ok: false, error: 'Too many transmissions from this location. Try again in a few minutes.' }, 429);

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096) return json({ ok: false, error: 'Payload too large.' }, 413);
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const parsed = pioneerSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, error: 'Please check the highlighted fields.', fieldErrors: toFieldErrors(parsed.error) }, 422);
  const d = parsed.data;
  if (d.website) return json({ ok: false, error: 'Malformed request.' }, 400); // honeypot

  try {
    const pool = getPool();
    const id = signalId();
    const { rows } = await pool.query<{ created_at: Date }>(
      `INSERT INTO pioneers (signal_id, full_name, email, country, role, message, updates)
       VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7) RETURNING created_at`,
      [id, d.fullName, d.email, d.country, d.role, d.message, d.updates],
    );
    const { rows: c } = await pool.query<{ n: string }>('SELECT count(*)::text AS n FROM pioneers');
    const sentAt = rows[0].created_at;
    return json({ ok: true, signalId: id, name: d.fullName, sentAt: sentAt.toISOString(), arrivesAt: arrivalDate(sentAt).toISOString(), count: Number(c[0].n) }, 201);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === '23505') return json({ ok: false, error: 'This email is already on the manifest.', fieldErrors: { email: 'This email is already on the manifest.' } }, 409);
    console.error('[pioneers] insert failed', code ?? (e as Error).message);
    return json({ ok: false, error: 'The registry is unreachable right now. Your details were not saved. Please try again shortly.' }, 503);
  }
}
