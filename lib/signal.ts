import { VESPER_LY } from './mission';

const LY_SECONDS = 365.25 * 86400;

/** Human readable one-way light delay for a distance in light-years. */
export function formatDelay(ly: number): { value: string; unit: string } {
  const s = ly * LY_SECONDS;
  if (s < 0.0005) return { value: '0.000', unit: 's' };
  if (s < 60) return { value: s.toFixed(3), unit: 's' };
  if (s < 3600) return { value: (s / 60).toFixed(2), unit: 'min' };
  if (s < 86400 * 2) return { value: (s / 3600).toFixed(2), unit: 'h' };
  if (s < LY_SECONDS * 0.5) return { value: (s / 86400).toFixed(1), unit: 'days' };
  return { value: ly.toFixed(2), unit: 'yr' };
}

/**
 * Page progress (0 at the hero, 1 at the reply) → distance of the signal from Earth.
 * Log scale so every chapter of the solar system gets screen time.
 */
export function distanceAt(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const min = Math.log10(1e-9), max = Math.log10(VESPER_LY);
  if (p >= 0.995) return 0;
  return Math.pow(10, max - (max - min) * p);
}

export function arrivalDate(from: Date): Date {
  return new Date(from.getTime() + VESPER_LY * LY_SECONDS * 1000);
}
