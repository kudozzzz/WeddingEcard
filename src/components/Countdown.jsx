import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { COUNTDOWN_TARGET } from '../data/events.js';
import Reveal from './Reveal.jsx';
import { LotusCrest, JaalWatermark } from './Ornaments.jsx';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * S3 — Counting the Moments.
 *
 * Ticks once a second, clears on unmount, and never renders a negative value.
 * On scroll-in the tiles bloom a soft gold glow and a shimmer band sweeps
 * across them once — light catching gold leaf, not a neon effect (§S3).
 */

const UNITS = ['Days', 'Hours', 'Minutes', 'Seconds'];
const CONFETTI_COLOURS = ['#AF8C3D', '#C9A961', '#791D2A', '#F0E8D6', '#1D234F'];

const reducedMotion = prefersReducedMotion;

/** Remaining time to the target, floored at zero. Never returns negatives. */
function remaining(now = Date.now()) {
  const ms = Math.max(0, new Date(COUNTDOWN_TARGET).getTime() - now);
  const total = Math.floor(ms / 1000);
  return {
    reached: ms === 0,
    values: [
      Math.floor(total / 86400),
      Math.floor(total / 3600) % 24,
      Math.floor(total / 60) % 60,
      total % 60,
    ],
  };
}

export default function Countdown() {
  const [state, setState] = useState(remaining);
  const [lit, setLit] = useState(false);
  const sectionRef = useRef(null);
  const celebratedRef = useRef(false);

  /* ---------------------------------------------------------------- ticking */

  useEffect(() => {
    if (state.reached) return; // nothing left to count
    const id = setInterval(() => setState(remaining()), 1000);
    return () => clearInterval(id);
  }, [state.reached]);

  /* ------------------------------------------------------- glow on scroll-in */

  useEffect(() => {
    if (reducedMotion()) return;
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLit(true);
          io.disconnect(); // once only
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* ------------------------------------------------- sustained zero-state pop */

  useEffect(() => {
    if (!state.reached || celebratedRef.current || reducedMotion()) return;
    celebratedRef.current = true;

    // 3 seconds, staggered.
    const end = Date.now() + 3000;
    const id = setInterval(() => {
      if (Date.now() > end) return clearInterval(id);
      confetti({
        particleCount: 40,
        spread: 75,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.6 },
        colors: CONFETTI_COLOURS,
      });
    }, 300);
    return () => clearInterval(id);
  }, [state.reached]);

  return (
    <section
      id="countdown"
      ref={sectionRef}
      className="section-y relative z-10 flex flex-col items-center px-6"
    >
      <Keyframes />
      <Reveal as="h2" className="section-heading">
        Counting the Moments
      </Reveal>

      {/* section-level crest, once — same geometry as the date card's */}
      <Reveal index={1} className="mb-7 mt-3" style={{ lineHeight: 0 }}>
        <LotusCrest />
      </Reveal>

      {state.reached ? (
        <p className="font-script" style={{ color: 'var(--maroon)', fontSize: '2.6rem' }}>
          Today is the day
        </p>
      ) : (
        <div
          className={`relative grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4 sm:gap-4${
            lit ? ' cd-lit' : ''
          }`}
        >
          {UNITS.map((label, i) => (
            <Tile key={label} value={state.values[i]} label={label} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One countdown tile.
 *
 * The rule is a single SVG path, not a CSS border, because it is BROKEN at the
 * top centre: it starts 16px right of top-centre, runs round all four rounded
 * corners, and stops 16px left of top-centre. The floret then sits centred on
 * that gap, straddling the line, so the ornament reads as interrupting the
 * border rather than floating inside it.
 */
/**
 * One countdown tile.
 *
 * The rule is a complete, unbroken rounded rectangle. It was previously an SVG
 * path with a 32px break at top centre to seat a floret; with the floret gone
 * the gap has no purpose, and a closed rule needs no measurement — so the
 * ResizeObserver and the path maths went with it.
 */
const RULE_INSET = 7;
const RULE_RADIUS = 6;

function Tile({ value, label }) {
  return (
    <div
      className="paper-card relative flex flex-col items-center justify-center overflow-hidden rounded-lg px-2 py-5"
      style={{ borderColor: 'var(--gold)', boxShadow: '0 4px 5px rgba(122,74,42,0.16)' }}
    >
      <JaalWatermark radius={8} />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: RULE_INSET,
          borderRadius: RULE_RADIUS,
          border: '1px solid var(--gold)',
          opacity: 0.45,
          zIndex: 0,
        }}
      />

      <span
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 500,
          fontSize: '2.6rem',
          lineHeight: 1.05,
          color: 'var(--maroon)',
          fontVariantNumeric: 'tabular-nums',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {value}
      </span>
      <span className="small-caps mt-1.5" style={{ color: 'var(--olive)', position: 'relative', zIndex: 1 }}>
        {label}
      </span>

      {/* shimmer band, swept once across the row */}
      <span aria-hidden="true" className="cd-shimmer" />
    </div>
  );
}

function Keyframes() {
  return (
    <style>{`
      /* glow blooms 0 -> 0.9 -> 0.35 over 1.8s and stays faintly lit */
      @keyframes cd-glow {
        0%   { box-shadow: 0 0 0 -8px rgba(175,140,61,0); }
        50%  { box-shadow: 0 0 40px -8px rgba(175,140,61,0.9); }
        100% { box-shadow: 0 0 40px -8px rgba(175,140,61,0.35); }
      }
      .cd-lit .paper-card { animation: cd-glow 1800ms ease-out forwards; }

      /* diagonal band travelling left to right across the four tiles, once */
      .cd-shimmer {
        position: absolute; inset: 0; opacity: 0; pointer-events: none;
        background: linear-gradient(115deg,
          transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%);
      }
      @keyframes cd-sweep {
        0%   { opacity: 0; transform: translateX(-130%); }
        18%  { opacity: 1; }
        82%  { opacity: 1; }
        100% { opacity: 0; transform: translateX(130%); }
      }
      .cd-lit .cd-shimmer { animation: cd-sweep 1600ms ease-in-out 260ms forwards; }
      /* stagger across the row so it reads as one band crossing all four */
      .cd-lit > :nth-child(1) .cd-shimmer { animation-delay: 260ms; }
      .cd-lit > :nth-child(2) .cd-shimmer { animation-delay: 380ms; }
      .cd-lit > :nth-child(3) .cd-shimmer { animation-delay: 500ms; }
      .cd-lit > :nth-child(4) .cd-shimmer { animation-delay: 620ms; }

      @media (prefers-reduced-motion: reduce) {
        .cd-lit .paper-card, .cd-lit .cd-shimmer { animation: none; }
        .cd-shimmer { display: none; }
      }
    `}</style>
  );
}
