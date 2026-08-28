import { COUNTDOWN_TARGET } from '../data/events.js';

/**
 * S3 — Counting the Moments.
 *
 * BUILD STEP 1: the tiles are laid out with a value computed once at render.
 * The live setInterval tick, the gold radial glow on scroll-in, the shimmer
 * sweep and the "Today is the day" zero state land in build step 5 (§10).
 */

const UNITS = ['Days', 'Hours', 'Minutes', 'Seconds'];

/** Remaining time to the target, floored at zero. Never returns negatives. */
function remaining(target = COUNTDOWN_TARGET, now = Date.now()) {
  const ms = Math.max(0, new Date(target).getTime() - now);
  const total = Math.floor(ms / 1000);
  return [
    Math.floor(total / 86400),
    Math.floor(total / 3600) % 24,
    Math.floor(total / 60) % 60,
    total % 60,
  ];
}

export default function Countdown() {
  const values = remaining();

  return (
    <section
      id="countdown"
      className="relative z-10 flex flex-col items-center px-6 py-20"
    >
      <h2 className="section-heading mb-10">Counting the Moments</h2>

      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4 sm:gap-4">
        {UNITS.map((label, i) => (
          <div
            key={label}
            className="paper-card flex flex-col items-center justify-center rounded-lg px-2 py-5"
            style={{ borderColor: 'var(--gold)' }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 500,
                fontSize: '2.6rem',
                lineHeight: 1.05,
                color: 'var(--maroon)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {values[i]}
            </span>
            <span className="small-caps mt-1.5" style={{ color: 'var(--olive)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
