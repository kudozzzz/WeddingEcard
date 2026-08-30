import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * The traditional invitation card in S2.
 *
 * It unrolls downward beneath the date card like a scroll being unrolled, and
 * then stays. There is no open control and nothing to dismiss. Tapping the
 * card opens the full-screen zoom view, exactly like the S7 gallery photos —
 * no icon, no label, the image is the target.
 *
 * The image is never referenced until the date is revealed.
 */

export const INVITATION_SRC = '/img/invitation/invitation-card.webp';
const UNROLLED_KEY = 'invitationUnrolled';

/** §S2 unroll — slow and deliberate, no bounce. */
const UNROLL_MS = 2600;
const UNROLL_EASE = 'cubic-bezier(0.33, 0, 0.15, 1)';
/**
 * Long enough for the date to register on its own, then the invitation follows
 * almost immediately. No longer tied to the confetti: the unroll is
 * compositor-driven, so a brief overlap costs nothing.
 */
const HOLD_BEFORE_UNROLL_MS = 600;

/**
 * Farmaan scroll mount (§S2). Colours are existing tokens only: the mount is
 * built on --maroon (#791D2A), all brass on --haldi (#C8891A).
 */
const MOUNT_PAD = 14;
const ROD_OVERHANG = 8;           // rod spans mount width + 16
const SMALL_VIEWPORT = 400;       // below this the rods and finials shrink
const ROD_H_FULL = 16;
const ROD_H_SMALL = 13;
const FINIAL_SPAN_FULL = 40;      // reach beyond the rod end
const FINIAL_SPAN_SMALL = 30;
const MOUNT_SHADOW = '0 6px 5.5px rgba(0,0,0,0.42)';
const BRASS =
  'linear-gradient(180deg, #8A5C10 0%, #F6DFA8 14%, #E8B45C 30%, #C8891A 52%, #9C6612 78%, #6B430B 100%)';

/** Viewport-driven sizing — the finials overhang, so this decides overflow. */
function useMountMetrics() {
  const [small, setSmall] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < SMALL_VIEWPORT,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${SMALL_VIEWPORT - 1}px)`);
    const on = () => setSmall(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () =>
      mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on);
  }, []);
  const rodH = small ? ROD_H_SMALL : ROD_H_FULL;
  const finialSpan = small ? FINIAL_SPAN_SMALL : FINIAL_SPAN_FULL;
  // Everything that sticks out beyond the mount, per side.
  const sideReach = ROD_OVERHANG + finialSpan;
  return { small, rodH, finialSpan, sideReach };
}

const read = (k) => {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

/**
 * Load the image only once `active` is true (the date has been revealed).
 * status: 'idle' | 'loading' | 'ready' | 'failed'
 */
function useInvitationImage(active) {
  const [status, setStatus] = useState('idle');
  // Guard with a ref, NOT with `status` in the dependency array. Depending on
  // status means setStatus('loading') re-runs this effect, React tears down the
  // previous run, and the cleanup cancels the in-flight load — the image never
  // resolves and the card sits in the loading state forever.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    setStatus('loading');

    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setStatus('ready');
    img.onerror = () => !cancelled && setStatus('failed');
    img.src = INVITATION_SRC; // the one and only request for this asset
    return () => {
      cancelled = true;
    };
  }, [active]);

  return status;
}

/**
 * Inline unrolling card.
 *
 * The reveal is clip-path, NOT height. Animating height forces a layout on
 * every frame for 2.6s, which is what made this jitter on a real phone. The
 * container keeps its intrinsic height from first paint — one layout event —
 * and only the clip rectangle animates, which the compositor handles alone.
 *
 * The image sits at natural size and is never scaled or squashed; the clip
 * progressively uncovers it.
 */
export function InvitationScroll({ active, onOpenViewer }) {
  const status = useInvitationImage(active);
  const reduced = prefersReducedMotion();

  /**
   * phase: 'armed' -> 'opening' -> 'done'
   *
   * 'armed' paints the closed clip with NO transition. Without that distinct
   * phase the element renders open first and then animates *closed* over 2.6s
   * before opening — the card visibly rolls up, then unrolls.
   */
  const [phase, setPhase] = useState(() => (read(UNROLLED_KEY) === '1' ? 'done' : 'armed'));
  // Measured ONCE, when the image is ready — the roller needs a pixel distance
  // to travel and container-query units are not dependable on older Android.
  const [cardH, setCardH] = useState(0);
  const { rodH, finialSpan, sideReach } = useMountMetrics();
  const boxRef = useRef(null);
  const startedRef = useRef(false);

  /**
   * The ONE layout read. useLayoutEffect, not useEffect: it runs before paint,
   * so the rod's armed offset is correct on the very first painted frame rather
   * than being 0 for a frame.
   *
   * cardH is only ever used to lift the bottom rod UP into its armed position.
   * The rod's resting place is plain CSS, so a missing measurement can never
   * strand it — see the note on the bottom rod below.
   */
  useLayoutEffect(() => {
    if (status !== 'ready' || cardH) return;
    if (boxRef.current) setCardH(boxRef.current.offsetHeight);
  }, [status, cardH]);

  /**
   * Start the unroll after a short hold.
   *
   * The container's height is NOT animated — it is reserved in full as soon as
   * the image is ready, in one layout event, well before anyone is looking at
   * the bottom edge. The reveal itself is clip-path, which the compositor
   * handles with no layout at all. There is therefore no rAF race and no
   * stuck-collapsed state to guard against: a backgrounded tab either resumes
   * the transition or arrives at the end state.
   */
  useEffect(() => {
    if (status !== 'ready' || startedRef.current || phase === 'done') return;
    startedRef.current = true;

    if (reduced) {
      write(UNROLLED_KEY, '1');
      setPhase('done');
      return;
    }

    const t = setTimeout(() => {
      write(UNROLLED_KEY, '1');
      setPhase('opening'); // flips the clip; the compositor animates it
    }, HOLD_BEFORE_UNROLL_MS);
    return () => clearTimeout(t);
  }, [status, phase, reduced]);

  const onTransitionEnd = (e) => {
    if (e.propertyName === 'clip-path' || e.propertyName === '-webkit-clip-path') {
      setPhase('done');
    }
  };

  // Missing file: render nothing at all — no gap, no placeholder.
  if (status === 'failed' || status === 'idle') return null;

  /* Subtle loading state, so the unroll never starts against an empty box. */
  if (status === 'loading') {
    return (
      <div className="mt-8 w-full" style={{ maxWidth: 340 }}>
        <Keyframes />
        <div
          aria-hidden="true"
          className="relative w-full overflow-hidden rounded-[10px]"
          style={{
            height: 72,
            border: '1px solid var(--gold)',
            backgroundColor: 'var(--paper-deep)',
          }}
        >
          <span className="inv-shimmer" />
        </div>
      </div>
    );
  }

  const closed = phase === 'armed';
  const clip = closed ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)';
  const moving = phase === 'opening';

  return (
    <div
      className="relative mt-8"
      style={{
        // The finials overhang, so the mount must be narrow enough that
        // mount + rods + finials still fits the viewport.
        width: `min(100%, calc(100vw - ${2 * sideReach + 8}px))`,
        maxWidth: 340,
      }}
    >
      <Keyframes />

      {/* Top rod — appears first and stays. The mount unrolls downward from it. */}
      <Rod rodH={rodH} finialSpan={finialSpan} style={{ top: -rodH / 2, zIndex: 2 }} />

      {/* Mount + card, revealed by clip-path. Height is intrinsic and reserved
          from first paint; only the clip rectangle animates. */}
      <div
        ref={boxRef}
        onTransitionEnd={onTransitionEnd}
        style={{
          clipPath: clip,
          WebkitClipPath: clip,
          transition: moving
            ? `clip-path ${UNROLL_MS}ms ${UNROLL_EASE}, -webkit-clip-path ${UNROLL_MS}ms ${UNROLL_EASE}`
            : 'none',
          willChange: phase === 'done' ? 'auto' : 'clip-path',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: MOUNT_PAD,
            background:
              'linear-gradient(160deg, #8E2434 0%, #791D2A 50%, #5C1420 100%)',
            boxShadow: MOUNT_SHADOW,
          }}
        >
          {/* hairline inset 6px */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 6,
              border: '1px solid #D9A24A',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          <img
            src={INVITATION_SRC}
            alt="Ankit and Srishti — traditional invitation card. Tap to zoom."
            onClick={onOpenViewer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenViewer();
              }
            }}
            role="button"
            tabIndex={0}
            className="tappable block w-full cursor-pointer"
            style={{ height: 'auto', display: 'block', border: '1px solid #E8B45C' }}
          />
        </div>
      </div>

      {/*
        Bottom rod. Its RESTING position is plain CSS — top:100% puts it on the
        mount's bottom edge with no transform at all. The unroll lifts it up to
        the top rod (negative translateY) and animates back to 0.

        That inversion is deliberate: the resting state must never be the END of
        an animation. Every path that skips the animation — reload, reduced
        motion, a backgrounded tab, an early return, a missed transitionend —
        renders translateY(0) and therefore lands correctly by default.

        It also STAYS at the end: this is a hanging scroll, not a roller that
        disappears.
      */}
      <Rod
        rodH={rodH}
        finialSpan={finialSpan}
        style={{
          top: '100%',
          marginTop: -rodH / 2,
          zIndex: 2,
          transform: closed ? `translateY(${-cardH}px)` : 'translateY(0px)',
          transition: moving ? `transform ${UNROLL_MS}ms ${UNROLL_EASE}` : 'none',
          willChange: phase === 'done' ? 'auto' : 'transform',
          // While armed, the mount is clipped away; if the measurement has not
          // landed yet the rod would sit at the bottom of an invisible mount.
          visibility: closed && !cardH ? 'hidden' : 'visible',
        }}
      />
    </div>
  );
}

/**
 * A gold rod with a finial at each end. Spans the mount width + 16px, so it
 * overhangs 8px on each side.
 */
function Rod({ rodH, finialSpan, style }) {
  const band = {
    position: 'absolute',
    top: -1.2,
    height: rodH + 2.4,
    width: 2.6,
    borderRadius: 1.3,
    background: BRASS,
  };
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ left: -ROD_OVERHANG, right: -ROD_OVERHANG, height: rodH, ...style }}
    >
      {/* body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: rodH / 2,
          background: BRASS,
          boxShadow: MOUNT_SHADOW,
        }}
      />
      {/* rim light and underside shadow */}
      <span
        style={{
          position: 'absolute', left: 6, right: 6, top: 1.4, height: 1.8,
          background: '#FFEEC4', opacity: 0.5, borderRadius: 1,
        }}
      />
      <span
        style={{
          position: 'absolute', left: 6, right: 6, bottom: 3, height: 1.6,
          background: '#5A3708', opacity: 0.42, borderRadius: 1,
        }}
      />
      {/* four ring bands — two at each end, where the rod meets the mount */}
      <span style={{ ...band, left: ROD_OVERHANG }} />
      <span style={{ ...band, left: ROD_OVERHANG + 5 }} />
      <span style={{ ...band, right: ROD_OVERHANG }} />
      <span style={{ ...band, right: ROD_OVERHANG + 5 }} />

      <Finial rodH={rodH} span={finialSpan} />
      <Finial rodH={rodH} span={finialSpan} flip />
    </div>
  );
}

/**
 * Turned-brass finial: collar, bulb with a groove, faceted spear, tip.
 *
 * Inline SVG rather than CSS shapes — the spear's two facets are what make it
 * read as turned metal rather than a flat triangle.
 */
function Finial({ rodH, span, flip = false }) {
  const R = rodH / 2;
  const half = R + 3.4 + 1.5;      // bulb ry plus a little breathing room
  const vbH = half * 2;
  const scale = span / 40;
  const h = vbH * scale;

  return (
    <svg
      width={span}
      height={h}
      viewBox={`0 ${-half} 40 ${vbH}`}
      style={{
        position: 'absolute',
        top: '50%',
        marginTop: -h / 2,
        [flip ? 'right' : 'left']: '100%',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="farmaan-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A5C10" />
          <stop offset="20%" stopColor="#F6DFA8" />
          <stop offset="48%" stopColor="#D69A2E" />
          <stop offset="80%" stopColor="#9C6612" />
          <stop offset="100%" stopColor="#6B430B" />
        </linearGradient>
      </defs>

      {/* 1. collar */}
      <rect x="0" y={-(R + 2.6)} width="6" height={2 * (R + 2.6)} rx="2" fill="url(#farmaan-brass)" />
      {/* 2. bulb, with the turned groove */}
      <ellipse cx="11" cy="0" rx="5.5" ry={R + 3.4} fill="url(#farmaan-brass)" />
      <ellipse cx="11" cy="0" rx="2.2" ry={(R + 3.4) * 0.6} fill="#6B430B" opacity="0.3" />
      {/* 3. spear, with the two facets */}
      <path
        d={`M15 ${-(R + 1.6)} L30 -3.4 L37 0 L30 3.4 L15 ${R + 1.6} Z`}
        fill="url(#farmaan-brass)"
      />
      <path d={`M15 ${-(R + 1.6)} L30 -3.4 L37 0 L15 0 Z`} fill="#FFE9B8" opacity="0.34" />
      <path d={`M15 ${R + 1.6} L30 3.4 L37 0 L15 0 Z`} fill="#5A3708" opacity="0.34" />
      {/* 4. tip */}
      <circle cx="38.5" cy="0" r="1.3" fill="url(#farmaan-brass)" />
    </svg>
  );
}

function Keyframes() {
  return (
    <style>{`
      .inv-shimmer {
        position: absolute; inset: 0; display: block;
        background: linear-gradient(100deg,
          transparent 35%, rgba(175,140,61,0.18) 50%, transparent 65%);
        animation: inv-shimmer 1400ms ease-in-out infinite;
      }
      @keyframes inv-shimmer {
        from { transform: translateX(-100%); }
        to   { transform: translateX(100%); }
      }
      @media (prefers-reduced-motion: reduce) {
        .inv-shimmer { animation: none; opacity: 0.35; }
      }
    `}</style>
  );
}

/* -------------------------------------------------------- full-screen zoom */

const MIN_SCALE = 1;
const MAX_SCALE = 5;

/**
 * Full-screen zoom view, opened by tapping the inline card.
 *
 * The card is dense print and unreadable fitted to a 390px screen, so pinch to
 * zoom and pan are the point of this view. Minimal pointer handler rather than
 * a library: native pinch zooms the visual viewport, which fights a
 * position:fixed overlay, and no zoom library fits the §7 budget.
 */
export default function InvitationViewer({ onClose }) {
  const reduced = prefersReducedMotion();
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const movedRef = useRef(false);

  /* Body scroll lock with exact restore — same approach as the S7 lightbox. */
  useEffect(() => {
    const y = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      void body.offsetHeight;
      // behavior:'instant' — the stylesheet sets scroll-behavior: smooth,
      // which would animate the restore.
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clampPan = useCallback((nx, ny, s) => {
    const stage = stageRef.current;
    if (!stage) return { x: nx, y: ny };
    const r = stage.getBoundingClientRect();
    const maxX = Math.max(0, (r.width * (s - 1)) / 2);
    const maxY = Math.max(0, (r.height * (s - 1)) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  }, []);

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* best effort */
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        scale,
        tx,
        ty,
      };
    } else if (pointers.current.size === 1) {
      gesture.current = { pan: { x: e.clientX, y: e.clientY }, tx, ty };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, g.scale * (dist / g.dist)));
      const panned = clampPan(g.tx + (mid.x - g.mid.x), g.ty + (mid.y - g.mid.y), next);
      movedRef.current = true;
      setScale(next);
      setTx(panned.x);
      setTy(panned.y);
    } else if (g.pan && scale > 1) {
      const dx = e.clientX - g.pan.x;
      const dy = e.clientY - g.pan.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      const panned = clampPan(g.tx + dx, g.ty + dy, scale);
      setTx(panned.x);
      setTy(panned.y);
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else if (pointers.current.size === 1) {
      const [only] = [...pointers.current.values()];
      gesture.current = { pan: { x: only.x, y: only.y }, tx, ty };
    }
  };

  const lastTap = useRef(0);
  const onStageClick = (e) => {
    const now = Date.now();
    const isDouble = now - lastTap.current < 300;
    lastTap.current = now;
    if (isDouble) {
      e.stopPropagation();
      if (scale > 1) {
        setScale(1);
        setTx(0);
        setTy(0);
      } else {
        setScale(2.5);
      }
      return;
    }
    if (movedRef.current || scale > 1) e.stopPropagation();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invitation card"
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{
        backgroundColor: 'var(--paper)',
        animation: reduced ? 'none' : 'inv-in 260ms ease-out',
      }}
    >
      <style>{`
        @keyframes inv-in { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes inv-in { from { opacity: 1 } to { opacity: 1 } }
        }
      `}</style>

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

      <div
        ref={stageRef}
        onClick={onStageClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        className="relative flex items-center justify-center overflow-hidden"
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <img
          src={INVITATION_SRC}
          alt="Ankit and Srishti — traditional invitation card"
          draggable={false}
          className="select-none"
          style={{
            maxWidth: '94vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: gesture.current ? 'none' : 'transform 180ms ease-out',
            willChange: 'transform',
            borderRadius: 4,
            boxShadow: '0 18px 44px -22px rgba(88,20,38,0.5)',
          }}
        />
      </div>

      {/* Download stays. A modal must remain dismissible, so the close control
          and Escape stay too. */}
      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={INVITATION_SRC}
          download="Ankit-and-Srishti-Invitation.webp"
          className="tappable btn-directions small-caps inline-flex items-center justify-center rounded-full px-5 py-2.5"
          style={{ minHeight: 44 }}
        >
          Download
        </a>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="tappable absolute"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          right: 12,
          width: 44,
          height: 44,
          color: 'var(--maroon)',
          background: 'transparent',
          border: 'none',
          fontSize: '1.7rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}
