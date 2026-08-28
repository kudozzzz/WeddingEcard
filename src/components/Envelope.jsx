import { useCallback, useEffect, useRef, useState } from 'react';
import { AS_MONOGRAM_PATH, AS_MONOGRAM_VIEWBOX } from '../data/monogram.js';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * S1 — Envelope gate.
 *
 * FIX 3a: this is a FIXED OVERLAY, not a section in normal document flow.
 * S2..S8 lay out normally with S2 at the top of the document, so the document
 * height never changes when this unmounts and nothing shifts. That is what
 * removes the scroll jump — there is deliberately no scroll-to-S2 anywhere in
 * this file or in App, because the guest is already at S2.
 *
 * No date appears in this section — hard rule 1.
 *
 * Colours and dimensions are fixed by §S1. Do not re-derive them, and do not
 * rebuild the jaal or the monogram from generated geometry.
 */

/* §S1 — recorded so they cannot drift. */
const CRIMSON = '#A82B4C';
const CRIMSON_DEEP = '#8E2140';
const CRIMSON_UNDER = '#C25A72'; // flap underside — lighter, so the fold reads as two-sided paper
const IVORY_RULE = '#F3E4C8';
const JAAL = 'url(/img/pattern/jaal-envelope.svg)';
const JAAL_TILE = '62px 62px';
const SEAL_PX = 92;

/* Flap covers the top 46%; its lower edge dips to 60% at centre. For a
   quadratic from (0,46) to (100,46) the midpoint is
   0.25*y0 + 0.5*yCtrl + 0.25*y1, so yCtrl = 74 puts the dip at exactly 60. */
const FLAP_EDGE = 46;
const FLAP_CTRL = 74;

/* Front face clip, in objectBoundingBox units. */
const FLAP_CLIP = `M0 0 H1 V${FLAP_EDGE / 100} Q0.5 ${FLAP_CTRL / 100} 0 ${FLAP_EDGE / 100} Z`;

/* Back face clip: the same shape mirrored about the box's horizontal centre
   (y -> 1-y). The back face is rotated 180deg about its own centre, which maps
   y -> 1-y again, so the mirrored shape lands exactly on the flap area. Without
   this the underside would appear at the BOTTOM of the envelope. */
const FLAP_CLIP_BACK =
  `M0 1 H1 V${1 - FLAP_EDGE / 100} Q0.5 ${1 - FLAP_CTRL / 100} 0 ${1 - FLAP_EDGE / 100} Z`;

const FLAP_EDGE_ONLY = `M0 ${FLAP_EDGE} Q50 ${FLAP_CTRL} 100 ${FLAP_EDGE}`;

/**
 * FIX 3 — open sequence, ~3.3s total. Staged so it reads as an envelope being
 * opened rather than a page transition.
 */
export const T = {
  sealPress: 150,        // 0.00s  seal presses in (tactile response to the tap)
  sealTotal: 650,        // 0.15s  seal lifts away, ends 0.65s
  hold1: 150,            // 0.65s  stillness
  flapStart: 800,        // 0.80s  flap opens
  flapDur: 1400,         //        ends 2.20s
  innerShadowStart: 1570, // flap passes ~55% of its rotation
  innerShadowDur: 600,
  hold2: 200,            // 2.20s  stillness
  liftStart: 2400,       // 2.40s  envelope lifts and dissolves
  liftDur: 900,          //        ends 3.30s
  crossFadeStart: 2600,  // 2.60s  page cross-fades in beneath
  crossFadeDur: 700,
  total: 3350,
};

const AUTO_OPEN_MS = 15000; // FIX 2 — was 6s

// Re-exported so App can keep importing it from here; the single definition
// lives in lib/motion.js so the two paths can never drift apart.
export { prefersReducedMotion };

export default function Envelope({ onOpen, startAudio }) {
  const [opening, setOpening] = useState(false);
  const firedRef = useRef(false);

  /**
   * The one place the envelope opens. Deliberately synchronous: this tap is the
   * user gesture that permits audio playback, and that permission is lost if
   * play() is called after an await.
   */
  const open = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // ---- AUDIO (§6) -------------------------------------------------
    // Called HERE, synchronously, before anything async. This is the hook
    // left in build step 3. App owns the element and swallows rejection.
    startAudio?.();
    // -----------------------------------------------------------------

    try {
      sessionStorage.setItem('envelopeOpened', '1');
    } catch {
      /* private mode — the gate simply runs again next visit */
    }

    setOpening(true);
    onOpen();
  }, [onOpen, startAudio]);

  /* §S1: WhatsApp's WebView on older Android sometimes swallows the first
     touch. If nothing is tapped, open anyway. */
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
  const run = opening && !reduced;

  return (
    <div
      // FIXED OVERLAY — out of document flow, so unmounting shifts nothing.
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: 'var(--paper)',
        animation: run
          ? `env-crossfade ${T.crossFadeDur}ms ease-in-out ${T.crossFadeStart}ms forwards`
          : 'none',
      }}
    >
      <Keyframes />

      {/* The page background lives behind the real page; repeat it here so the
          overlay is opaque and matches exactly. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'url(/img/pattern/jaal-paper.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
          opacity: 0.07,
        }}
      />

      {/* Small caps on bare --paper, so --gold-text, not --gold (§3). */}
      <p
        className="small-caps relative mb-10 text-center"
        style={{ color: 'var(--gold-text)', letterSpacing: '0.3em' }}
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
        className="tappable relative w-[78vw] max-w-[340px] cursor-pointer"
        style={{
          animation: run
            ? `env-lift ${T.liftDur}ms ease-in-out ${T.liftStart}ms forwards`
            : 'none',
        }}
      >
        <div className="relative aspect-square" style={{ perspective: 1400 }}>
          <svg width="0" height="0" aria-hidden="true" className="absolute">
            <defs>
              <clipPath id="flap-clip" clipPathUnits="objectBoundingBox">
                <path d={FLAP_CLIP} />
              </clipPath>
              <clipPath id="flap-clip-back" clipPathUnits="objectBoundingBox">
                <path d={FLAP_CLIP_BACK} />
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
            <div
              className="absolute"
              style={{ inset: 11, border: `1px solid ${IVORY_RULE}`, opacity: 0.34 }}
            />
            <div
              className="absolute"
              style={{ inset: 15.5, border: `0.6px solid ${IVORY_RULE}`, opacity: 0.2 }}
            />

            {/* Interior shadow — fades in as the flap passes ~55%, so the
                envelope reads as hollow rather than as a flat card. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0"
              style={{
                height: '62%',
                background:
                  'linear-gradient(180deg, rgba(40,6,16,0.62) 0%, rgba(40,6,16,0.28) 45%, rgba(40,6,16,0) 100%)',
                opacity: 0,
                animation: run
                  ? `env-inner-shadow ${T.innerShadowDur}ms ease-out ${T.innerShadowStart}ms forwards`
                  : 'none',
              }}
            />

            {/* Shadow cast by the lifting flap, travelling down the face. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0"
              style={{
                height: '46%',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%)',
                opacity: 0,
                animation: run
                  ? `env-flap-shadow ${T.flapDur}ms cubic-bezier(0.34,0.02,0.15,1) ${T.flapStart}ms forwards`
                  : 'none',
              }}
            />
          </div>

          {/* ---- flap ----
              Two-sided: the rotator carries preserve-3d, and each face is
              clipped individually. clip-path on the rotator itself would
              flatten the 3D context and kill the underside. */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: 'top',
              animation: run
                ? `env-flap ${T.flapDur}ms cubic-bezier(0.34,0.02,0.15,1) ${T.flapStart}ms forwards`
                : 'none',
            }}
          >
            {/* front */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'url(#flap-clip)',
                WebkitClipPath: 'url(#flap-clip)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: `linear-gradient(180deg, ${CRIMSON} 0%, ${CRIMSON_DEEP} 60%)`,
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

            {/* underside — lighter crimson, mirrored clip, flipped 180deg */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'url(#flap-clip-back)',
                WebkitClipPath: 'url(#flap-clip-back)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateX(180deg)',
                background: `linear-gradient(180deg, ${CRIMSON_UNDER} 0%, ${CRIMSON} 100%)`,
              }}
            />
          </div>

          {/* fold line + highlight; leaves with the seal */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: run ? `env-fade-out 300ms ease-out ${T.flapStart}ms forwards` : 'none',
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

          <WaxSeal opening={opening} reduced={reduced} run={run} />
        </div>
      </div>

      <p
        className="font-script relative mt-12 text-center"
        style={{
          color: 'var(--maroon)',
          fontSize: '1.6rem',
          animation: run ? `env-fade-out ${T.sealTotal}ms ease-out forwards` : 'none',
        }}
      >
        Tap the seal to open
      </p>
    </div>
  );
}

/**
 * Wax seal — ~92px, on the flap's lower curve at centre (60% of height).
 * Cream wax, dark monogram — never the inversion (§S1).
 */
function WaxSeal({ opening, reduced, run }) {
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
        opacity: opening && reduced ? 0 : 1,
        animation: run ? `env-seal ${T.sealTotal}ms forwards` : undefined,
      }}
    >
      <svg
        viewBox="0 0 92 92"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="wax-fill" cx="36%" cy="30%" r="76%">
            <stop offset="0%" stopColor="#EFE3C8" />
            <stop offset="58%" stopColor="#D9CBAB" />
            <stop offset="100%" stopColor="#C3B491" />
          </radialGradient>
          <filter id="wax-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="rgba(60,14,26,0.42)" />
          </filter>
        </defs>

        <path
          filter="url(#wax-shadow)"
          fill="url(#wax-fill)"
          d="M90.76 46.00C90.87 50.62 90.57 55.71 88.97 59.96C87.36 64.21 83.91 67.83 81.11 71.51C78.31 75.19 75.73 79.22 72.17 82.02C68.61 84.82 64.11 87.18 59.75 88.31C55.38 89.44 50.53 88.98 46.00 88.82C41.47 88.66 36.80 88.66 32.56 87.36C28.32 86.06 24.31 83.56 20.55 81.03C16.79 78.49 12.93 75.66 10.01 72.15C7.09 68.64 4.38 64.33 3.01 59.97C1.64 55.61 1.71 50.64 1.77 46.00C1.83 41.36 1.90 36.44 3.36 32.14C4.81 27.85 7.81 23.98 10.51 20.21C13.20 16.45 15.89 12.29 19.52 9.55C23.15 6.81 27.86 5.04 32.28 3.76C36.69 2.48 41.51 1.60 46.00 1.86C50.49 2.11 54.80 4.03 59.22 5.30C63.64 6.57 68.78 7.03 72.52 9.50C76.26 11.96 79.04 16.29 81.67 20.08C84.30 23.88 86.78 27.94 88.30 32.26C89.81 36.58 90.64 41.38 90.76 46.00Z"
        />
        <path
          fill="none"
          stroke="#B5A484"
          strokeWidth="1"
          d="M83.64 46.00C83.73 49.88 83.48 54.16 82.13 57.74C80.78 61.31 77.88 64.36 75.52 67.45C73.17 70.54 71.00 73.94 68.01 76.29C65.01 78.65 61.23 80.62 57.56 81.58C53.89 82.53 49.81 82.14 46.00 82.01C42.19 81.87 38.27 81.87 34.70 80.78C31.13 79.69 27.76 77.59 24.60 75.45C21.44 73.32 18.19 70.94 15.74 67.99C13.28 65.04 11.00 61.41 9.85 57.75C8.69 54.08 8.76 49.90 8.80 46.00C8.85 42.10 8.92 37.96 10.14 34.35C11.37 30.73 13.89 27.48 16.15 24.32C18.42 21.15 20.68 17.66 23.73 15.35C26.78 13.04 30.75 11.56 34.46 10.48C38.17 9.40 42.22 8.66 46.00 8.88C49.78 9.09 53.40 10.70 57.12 11.78C60.84 12.85 65.16 13.23 68.30 15.30C71.45 17.38 73.78 21.02 75.99 24.21C78.21 27.40 80.29 30.81 81.57 34.44C82.84 38.08 83.54 42.12 83.64 46.00Z"
        />
      </svg>

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

/** All open-sequence keyframes in one place, so the timeline is readable. */
function Keyframes() {
  return (
    <style>{`
      @keyframes seal-breathe { 0%,100% { scale: 1 } 50% { scale: 1.04 } }
      .seal-pulse { animation: seal-breathe 2.6s ease-in-out infinite; }

      /* press in, then lift away — per-keyframe easing gives the two stages
         their own feel inside one animation */
      @keyframes env-seal {
        0%   { scale: 1;    opacity: 1; animation-timing-function: ease-in; }
        23%  { scale: 0.94; opacity: 1; animation-timing-function: ease-out; }
        100% { scale: 1.18; opacity: 0; }
      }

      @keyframes env-flap {
        from { transform: rotateX(0deg); }
        to   { transform: rotateX(-172deg); }
      }

      @keyframes env-inner-shadow { from { opacity: 0 } to { opacity: 1 } }

      /* shadow travels down the face as the flap lifts off it */
      @keyframes env-flap-shadow {
        0%   { opacity: 0;    transform: translateY(0); }
        30%  { opacity: 0.85; }
        100% { opacity: 0;    transform: translateY(46%); }
      }

      @keyframes env-lift {
        from { transform: translateY(0) scale(1);         opacity: 1; }
        to   { transform: translateY(-8px) scale(1.06);   opacity: 0; }
      }

      @keyframes env-crossfade { from { opacity: 1 } to { opacity: 0 } }
      @keyframes env-fade-out  { from { opacity: 1 } to { opacity: 0 } }

      @media (prefers-reduced-motion: reduce) {
        .seal-pulse { animation: none; }
      }
    `}</style>
  );
}
