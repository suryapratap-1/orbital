import { z } from 'zod';
import { PIONEER_ROLES } from './mission';

const roles = PIONEER_ROLES.map((r) => r.v) as [string, ...string[]];

/** Shared by the form (client) and the route handler (server). */
export const pioneerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter at least 2 characters.').max(80, 'Keep it under 80 characters.'),
  email: z.string().trim().toLowerCase().max(254, 'That email is too long.').pipe(z.email('Enter a valid email address.')),
  country: z.string().trim().min(2, 'Tell us where you are signing from.').max(60, 'Keep it under 60 characters.'),
  role: z.enum(roles, 'Choose the option that fits best.'),
  message: z.string().trim().max(140, '140 characters maximum.').optional().default(''),
  updates: z.boolean().optional().default(false),
  consent: z.literal(true, 'You need to agree before we can transmit your name.'),
  /** honeypot — must stay empty */
  website: z.string().max(0).optional().default(''),
});

export type PioneerInput = z.input<typeof pioneerSchema>;
export type FieldErrors = Partial<Record<keyof PioneerInput, string>>;

export type PioneerResponse =
  | { ok: true; signalId: string; name: string; sentAt: string; arrivesAt: string; count: number }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function toFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = issue.path[0] as keyof PioneerInput | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}
