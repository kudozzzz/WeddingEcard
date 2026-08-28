import { useCallback, useEffect, useRef, useState } from 'react';
import { AS_MONOGRAM_PATH, AS_MONOGRAM_VIEWBOX } from '../data/monogram.js';

/**
 * S1 — Envelope (full viewport, gate).
 *
 * The visual design is finished and frozen. This file adds only behaviour:
 * the tap-to-open sequence, the 6s auto-open fallback, and the sessionStorage
 * flag. Scroll locking and the scroll-to-S2 timing are owned by App, which is
 * also what unmounts this section once the sequence completes.
 *
 * No date appears in this section — hard rule 1.
 *
 * Every colour and dimension below is fixed by §S1. Do not re-derive them, and
 * do not rebuild the jaal or the monogram from generated geometry.
 */

/* §S1 — recorded so they cannot drift. */
const CRIMSON = '#A82B4C';
const CRIMSON_DEEP = '#8E2140';
const IVORY_RULE = '#F3E4C8';
const JAAL = 'url(/img/pattern/jaal-envelope.svg)';
const JAAL_TILE = '62px 62px';
const SEAL_PX = 92;

/* Flap covers the top 46%; its lower edge dips to 60% at centre. For a
   quadratic from (0,46) to (100,46) the midpoint is
   0.25*y0 + 0.5*yCtrl + 0.25*y1, so yCtrl = 74 puts the dip at exactly 60. */
const FLAP_EDGE = 46;
const FLAP_CTRL = 74;

/* Same curve in objectBoundingBox units (0-1) for the CSS clip-path. Clipping a
   real div — rather than filling an SVG path — is what lets the flap's jaal
   tile at a literal 62px and line up with the body's. */
const FLAP_CLIP = `M0 0 H1 V${FLAP_EDGE / 100} Q0.5 ${FLAP_CTRL / 100} 0 ${FLAP_EDGE / 100} Z`;
const FLAP_EDGE_ONLY = `M0 ${FLAP_EDGE} Q50 ${FLAP_CTRL} 100 ${FLAP_EDGE}`;

/** §S1 open-sequence timings, in ms. */
export const OPEN_TIMING = {
  seal: 300,      // seal fades + scales out
  flap: 800,      // flap rotates to -165deg
  envelope: 500,  // whole envelope scales to 1.15 and fades
  envelopeDelay: 500,
};

const AUTO_OPEN_MS = 6000;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Envelope({ onOpen }) {
  const [opening, setOpening] = useState(false);
  const firedRef = useRef(false);

  /**
   * The one place the envelope opens. Kept synchronous on purpose: the tap
   * that calls this is the user gesture that will unlock audio playback in
   * build step 6, and that only counts if play() is called without awaiting
   * anything first.
   */
  const open = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // ---------------------------------------------------------------
    // AUDIO HOOK — build step 6 (§6).
    // audio.play() goes HERE, synchronously, before anything async.
    // This tap is the user gesture that permits playback; calling play()
    // after an await would lose that permission on mobile browsers.
    // Wrap it in .catch(() => setMuted(true)) — never let it throw.
    // ---------------------------------------------------------------

    try {
      sessionStorage.setItem('envelopeOpened', '1');
    } catch {
      /* private mode — the gate simply runs again next visit */
    }

    setOpening(true);
    onOpen();
  }, [onOpen]);

  /* §S1: WhatsApp's WebView on older Android sometimes swallows the first
     touch. If nothing is tapped in 6s, open anyway. */
  useEffect(() => {
    const t = setTimeout(open, AUTO_OPEN_MS);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const reduced = prefersReducedMotion();

  return (
    <section
      id="envelope"
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16"
    >
      {/* Small caps on bare --paper, so --gold-text, not --gold (§3).
          Fades on the same curve as the envelope, otherwise it hangs at full
          opacity while everything else leaves and then blinks out at unmount. */}
      <p
        className="small-caps mb-10 text-center"
        style={{
          color: 'var(--gold-text)',
          letterSpacing: '0.3em',
          opacity: opening ? 0 : 1,
          transition: reduced
            ? 'none'
            : `opacity ${OPEN_TIMING.envelope}ms ease-in ${OPEN_TIMING.envelopeDelay}ms`,
        }}
      >
        An Invitation Awaits
      </p>

      {/* The whole envelope is the hit target, not just the seal (§S1). */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Open the invitation"
        onClick={open}
        onKeyDown={onKeyDown}
        className="relative w-[78vw] max-w-[340px] cursor-pointer"
        style={{
          transform: opening ? 'scale(1.15)' : 'scale(1)',
          opacity: opening ? 0 : 1,
          transition: reduced
            ? 'none'
            : `transform ${OPEN_TIMING.envelope}ms ease-in ${OPEN_TIMING.envelopeDelay}ms,` +
              ` opacity ${OPEN_TIMING.envelope}ms ease-in ${OPEN_TIMING.envelopeDelay}ms`,
        }}
      >
        <div className="relative aspect-square" style={{ perspective: 1200 }}>
          {/* clip path lives here so both the flap and its overlay can use it */}
          <svg width="0" height="0" aria-hidden="true" className="absolute">
            <defs>
              <clipPath id="flap-clip" clipPathUnits="objectBoundingBox">
                <path d={FLAP_CLIP} />
              </clipPath>
            </defs>
          </svg>

          {/* ---- body ---- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[4px]"
            style={{
              backgroundColor: CRIMSON,
              boxShadow: '0 20px 44px -20px rgba(88,20,38,0.55)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: JAAL,
                backgroundRepeat: 'repeat',
                backgroundSize: JAAL_TILE,
                opacity: 0.3,
              }}
            />
            {/* double inset rule */}
            <div
              className="absolute"
              style={{ inset: 11, border: `1px solid ${IVORY_RULE}`, opacity: 0.34 }}
            />
            <div
              className="absolute"
              style={{ inset: 15.5, border: `0.6px solid ${IVORY_RULE}`, opacity: 0.2 }}
            />
          </div>

          {/* ---- flap ----
              Full-height div clipped to the curve. The gradient reaches
              CRIMSON_DEEP at 60%, i.e. at the curve's lowest point, so it
              completes within the visible flap rather than being cut off.
              Rotating this element rotates the clipped shape, because
              clip-path is applied in local space before the transform. */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'url(#flap-clip)',
              WebkitClipPath: 'url(#flap-clip)',
              background: `linear-gradient(180deg, ${CRIMSON} 0%, ${CRIMSON_DEEP} 60%)`,
              transformOrigin: 'top',
              transform: opening ? 'rotateX(-165deg)' : 'rotateX(0deg)',
              transition: reduced ? 'none' : `transform ${OPEN_TIMING.flap}ms ease-in-out`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: JAAL,
                backgroundRepeat: 'repeat',
                backgroundSize: JAAL_TILE,
                opacity: 0.3,
              }}
            />
          </div>

          {/* fold line + highlight along the curve. Fades with the flap so it
              does not hang in the air once the flap has rotated away. */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              opacity: opening ? 0 : 1,
              transition: reduced ? 'none' : `opacity ${OPEN_TIMING.seal}ms ease-out`,
            }}
          >
            <path
              d={FLAP_EDGE_ONLY}
              fill="none"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            <g transform="translate(0 1.2)">
              <path
                d={FLAP_EDGE_ONLY}
                fill="none"
                stroke="rgba(243,228,200,0.16)"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>

          <WaxSeal opening={opening} reduced={reduced} />
        </div>
      </div>

      <p
        className="font-script mt-12 text-center"
        style={{
          color: 'var(--maroon)',
          fontSize: '1.6rem',
          opacity: opening ? 0 : 1,
          transition: reduced ? 'none' : `opacity ${OPEN_TIMING.seal}ms ease-out`,
        }}
      >
        Tap the seal to open
      </p>
    </section>
  );
}

/**
 * Wax seal — ~92px, sitting on the flap's lower curve at centre (60% of height).
 *
 * Cream wax, dark monogram. Never the inversion: a maroon seal with cream
 * lettering does not read as wax (§S1).
 *
 * Breathing pulse signals it is tappable; it stops the moment the sequence
 * starts, and never runs under prefers-reduced-motion.
 */
function WaxSeal({ opening, reduced }) {
  return (
    <div
      className={opening || reduced ? '' : 'seal-pulse'}
      style={{
        position: 'absolute',
        left: '50%',
        top: '60%',
        width: SEAL_PX,
        height: SEAL_PX,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate(-50%, -50%)',
        opacity: opening ? 0 : 1,
        transition: reduced
          ? 'none'
          : `opacity ${OPEN_TIMING.seal}ms ease-out, scale ${OPEN_TIMING.seal}ms ease-out`,
        scale: opening ? '0.8' : '1',
      }}
    >
      <style>{`
        @keyframes seal-breathe {
          0%, 100% { scale: 1; }
          50%      { scale: 1.04; }
        }
        /* translate lives on the element itself, so animate the scale
           property separately rather than fighting over transform */
        .seal-pulse { animation: seal-breathe 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .seal-pulse { animation: none; }
        }
      `}</style>

      <svg
        viewBox="0 0 92 92"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* offset to 36%/30% so the light reads top-left */}
          <radialGradient id="wax-fill" cx="36%" cy="30%" r="76%">
            <stop offset="0%" stopColor="#EFE3C8" />
            <stop offset="58%" stopColor="#D9CBAB" />
            <stop offset="100%" stopColor="#C3B491" />
          </radialGradient>
          <filter id="wax-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="rgba(60,14,26,0.42)" />
          </filter>
        </defs>

        {/* irregular blob, not a circle — 20 points, jittered radii, smoothed */}
        <path
          filter="url(#wax-shadow)"
          fill="url(#wax-fill)"
          d="M90.76 46.00C90.87 50.62 90.57 55.71 88.97 59.96C87.36 64.21 83.91 67.83 81.11 71.51C78.31 75.19 75.73 79.22 72.17 82.02C68.61 84.82 64.11 87.18 59.75 88.31C55.38 89.44 50.53 88.98 46.00 88.82C41.47 88.66 36.80 88.66 32.56 87.36C28.32 86.06 24.31 83.56 20.55 81.03C16.79 78.49 12.93 75.66 10.01 72.15C7.09 68.64 4.38 64.33 3.01 59.97C1.64 55.61 1.71 50.64 1.77 46.00C1.83 41.36 1.90 36.44 3.36 32.14C4.81 27.85 7.81 23.98 10.51 20.21C13.20 16.45 15.89 12.29 19.52 9.55C23.15 6.81 27.86 5.04 32.28 3.76C36.69 2.48 41.51 1.60 46.00 1.86C50.49 2.11 54.80 4.03 59.22 5.30C63.64 6.57 68.78 7.03 72.52 9.50C76.26 11.96 79.04 16.29 81.67 20.08C84.30 23.88 86.78 27.94 88.30 32.26C89.81 36.58 90.64 41.38 90.76 46.00Z"
        />
        {/* inner rule, following the blob inset ~7px */}
        <path
          fill="none"
          stroke="#B5A484"
          strokeWidth="1"
          d="M83.64 46.00C83.73 49.88 83.48 54.16 82.13 57.74C80.78 61.31 77.88 64.36 75.52 67.45C73.17 70.54 71.00 73.94 68.01 76.29C65.01 78.65 61.23 80.62 57.56 81.58C53.89 82.53 49.81 82.14 46.00 82.01C42.19 81.87 38.27 81.87 34.70 80.78C31.13 79.69 27.76 77.59 24.60 75.45C21.44 73.32 18.19 70.94 15.74 67.99C13.28 65.04 11.00 61.41 9.85 57.75C8.69 54.08 8.76 49.90 8.80 46.00C8.85 42.10 8.92 37.96 10.14 34.35C11.37 30.73 13.89 27.48 16.15 24.32C18.42 21.15 20.68 17.66 23.73 15.35C26.78 13.04 30.75 11.56 34.46 10.48C38.17 9.40 42.22 8.66 46.00 8.88C49.78 9.09 53.40 10.70 57.12 11.78C60.84 12.85 65.16 13.23 68.30 15.30C71.45 17.38 73.78 21.02 75.99 24.21C78.21 27.40 80.29 30.81 81.57 34.44C82.84 38.08 83.54 42.12 83.64 46.00Z"
        />
      </svg>

      {/* Monogram — supplied SVG path, not type. Centred by its own box. */}
      <svg
        viewBox={AS_MONOGRAM_VIEWBOX}
        className="relative"
        style={{ width: SEAL_PX * 0.62 }}
        role="img"
        aria-label="A S"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={AS_MONOGRAM_PATH} fill="#7A1A2E" />
      </svg>
    </div>
  );
}
