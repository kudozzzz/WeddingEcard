/**
 * Shared motion helpers (§3).
 *
 * The scroll-in animation is implemented with IntersectionObserver + CSS
 * transitions rather than framer-motion, which measured +109KB and would put
 * the page 93KB over the §7 budget. The values below are the spec; the
 * observer options map 1:1 onto framer-motion's
 * viewport={{ once: true, amount, margin }}.
 */

/**
 * Tuned for reading pace, not for scrolling fast.
 *
 * The previous curve, cubic-bezier(0.22, 1, 0.36, 1), covers ~80% of its
 * distance in the first 25% of the duration — it reads as a pop. This one is
 * near-symmetric, so the movement is spread across the whole duration.
 */
export const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

/** Transform settles first; opacity finishes just after it. */
export const DURATION_MS = 900;
export const OPACITY_DURATION_MS = 1000;

/** Less distance, more time. */
export const Y_OFFSET = 16;

/**
 * Fire early: 5% visibility, with the observer root extended 15% BELOW the
 * viewport, so an element is already animating before the guest scrolls it
 * into view rather than starting once it has arrived.
 */
export const VIEWPORT_AMOUNT = 0.05;
export const VIEWPORT_MARGIN = '0px 0px 15% 0px';

export const STAGGER_MS = 60;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * S2 gold dust (§S2).
 *
 * Visible and quick, not a lingering haze: scalar 0.85 makes the particles
 * large enough to read at all, gravity 0.6 makes them fall and clear rather
 * than hang, and ticks 140 caps the lifetime. Roughly 1.4s on screen, mostly
 * gone by the time the unroll starts.
 */
const DUST_BASE = {
  spread: 110,
  startVelocity: 32,
  gravity: 0.6,
  ticks: 140,
  shapes: ['circle'],
  origin: { y: 0.55 },
  colors: ['#C8891A', '#E8B45C', '#F6DFA8', '#AF8C3D', '#F0E8D6'],
};

export const DUST_BURSTS = [
  { ...DUST_BASE, particleCount: 220, scalar: 0.85 },
  { ...DUST_BASE, particleCount: 120, scalar: 0.65 },
];
export const DUST_SECOND_BURST_DELAY_MS = 200;
