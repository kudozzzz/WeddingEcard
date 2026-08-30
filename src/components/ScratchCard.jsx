import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GoldRule, CornerOrnaments } from './Ornaments.jsx';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * S2 — Scratch card.
 *
 * The date underneath is real DOM and always present; the canvas above it is
 * erased with destination-out compositing until 28% is cleared, at which point
 * the rest fades and confetti fires. Hard rule 1 is satisfied because the date
 * is never *visible* in S2 until the guest reveals it.
 *
 * Everything here is pointer events — one code path for mouse, touch and pen.
 * Separate mouse/touch handlers double-fire on hybrid devices.
 */

const CARD_W = 300;
const CARD_H = 190;
const BRUSH_R = 25;          // FIX 4 — was 22
const REVEAL_AT = 0.28;      // FIX 4 — was 0.45; two or three swipes should do it
const SAMPLE_EVERY = 12;     // moves between alpha samples — sampling is costly

/* Guards so a single tap (or one stray drag) cannot clear the card outright.
   Both must be satisfied before auto-reveal can fire. */
const MIN_MOVES = 3;
const MIN_CLEARED = 0.08;
const FALLBACK_AFTER_MS = 10000;

const CONFETTI_COLOURS = ['#AF8C3D', '#C9A961', '#791D2A', '#F0E8D6', '#1D234F'];

const reduced = prefersReducedMotion;

const alreadyRevealed = () => {
  try {
    return sessionStorage.getItem('dateRevealed') === '1';
  } catch {
    return false;
  }
};

export default function ScratchCard() {
  const [revealed, setRevealed] = useState(alreadyRevealed);
  const [showFallback, setShowFallback] = useState(false);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const movesRef = useRef(0);
  const touchedRef = useRef(false);
  const doneRef = useRef(false);

  /* ---------------------------------------------------------------- reveal */

  const fireConfetti = useCallback(() => {
    if (reduced()) return;
    const burst = () =>
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLOURS,
      });
    burst();
    setTimeout(burst, 180);
  }, []);

  const reveal = useCallback(
    ({ withConfetti = true } = {}) => {
      if (doneRef.current) return;
      doneRef.current = true;

      try {
        sessionStorage.setItem('dateRevealed', '1');
      } catch {
        /* private mode — it simply re-scratches next visit */
      }

      const canvas = canvasRef.current;
      if (canvas && !reduced()) {
        canvas.style.transition = 'opacity 400ms ease-out';
        canvas.style.opacity = '0';
        setTimeout(() => setRevealed(true), 400);
      } else {
        setRevealed(true);
      }

      if (withConfetti) fireConfetti();
    },
    [fireConfetti],
  );

  /* ------------------------------------------------------------ paint once */

  const paintSurface = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || CARD_W;
    const h = rect.height || CARD_H;

    // Size by devicePixelRatio or the surface renders soft on phones.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctxRef.current = ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    // Gold gradient, 135deg — same values as the frozen static surface.
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#C9A961');   // --gold-light
    g.addColorStop(0.48, '#AF8C3D'); // --gold
    g.addColorStop(1, '#E4D5AC');   // --gold-pale
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Faint diagonal shimmer.
    const s = ctx.createLinearGradient(0, h, w, 0);
    s.addColorStop(0.34, 'rgba(255,255,255,0)');
    s.addColorStop(0.5, 'rgba(255,255,255,0.34)');
    s.addColorStop(0.66, 'rgba(255,255,255,0)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, w, h);

    // SCRATCH TO REVEAL — small caps, letterspaced 0.18em.
    // Solid #3A2E11, no opacity reduction: it measures 4.21:1 against the
    // darkest point of the gold gradient (--gold #AF8C3D) and 9.13:1 against
    // the lightest (--gold-pale), so it stays readable across the whole
    // surface. Size, tracking and small-caps treatment are unchanged.
    // Drawn per character because canvas letterSpacing is not universal.
    const label = 'SCRATCH TO REVEAL';
    const size = 11.2;
    const tracking = size * 0.18;
    ctx.font = `500 ${size}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#3A2E11';
    ctx.textBaseline = 'middle';

    const widths = [...label].map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + tracking * (label.length - 1);
    let x = (w - total) / 2;
    const y = h / 2;
    [...label].forEach((ch, i) => {
      ctx.fillText(ch, x, y);
      x += widths[i] + tracking;
    });

    ctx.globalCompositeOperation = 'destination-out';
    // The brush must be FULLY opaque. In destination-out the source alpha is
    // what gets removed, and fillStyle is still the shimmer gradient here —
    // whose alpha peaks at 0.34, so dabs would only erase a third of the
    // surface and leave a gold ghost over the date no matter how hard you rub.
    ctx.fillStyle = 'rgba(0,0,0,1)';
  }, []);

  useEffect(() => {
    if (revealed) return;
    // Wait for the webfont, or the label paints in a fallback face.
    let cancelled = false;
    const run = () => {
      if (!cancelled) paintSurface();
    };
    if (document.fonts?.ready) document.fonts.ready.then(run);
    else run();

    // Re-paint on resize, but only while untouched — repainting mid-scratch
    // would wipe the guest's progress.
    const onResize = () => {
      if (!touchedRef.current && !doneRef.current) paintSurface();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, [paintSurface, revealed]);

  /* ------------------------------------------------------- alpha sampling  */

  /** Fraction of the surface erased. Strided — reading every pixel is wasteful. */
  const clearedFraction = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return 0;

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    // step 8 pixels => every 32nd byte on the alpha channel
    for (let i = 3; i < data.length; i += 32) {
      if (data[i] < 24) clear++;
      total++;
    }
    return total ? clear / total : 0;
  }, []);

  /* ------------------------------------------------------- pointer handlers */

  /**
   * Auto-reveal, guarded. Requires real scratching: at least MIN_MOVES pointer
   * moves AND MIN_CLEARED of the surface gone, on top of the REVEAL_AT
   * threshold. Without this a single tap-and-hold on a small card could clear
   * enough area to trip the threshold immediately.
   */
  const tryAutoReveal = () => {
    if (doneRef.current) return;
    if (movesRef.current < MIN_MOVES) return;
    const cleared = clearedFraction();
    if (cleared < MIN_CLEARED) return;
    if (cleared >= REVEAL_AT) reveal();
  };

  const pointAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const dab = (x, y) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R, 0, Math.PI * 2);
    ctx.fill();
  };

  /** Interpolate, or a fast swipe leaves unerased gaps between samples. */
  const strokeTo = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / (BRUSH_R / 2)));
    for (let i = 1; i <= steps; i++) {
      dab(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    }
  };

  const onPointerDown = (e) => {
    if (doneRef.current) return;
    e.preventDefault();
    drawingRef.current = true;
    touchedRef.current = true;
    setShowFallback(false);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const p = pointAt(e);
    lastRef.current = p;
    dab(p.x, p.y); // a single tap-and-hold must mark, not just a drag
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current || doneRef.current) return;
    e.preventDefault();
    const p = pointAt(e);
    strokeTo(lastRef.current ?? p, p);
    lastRef.current = p;

    movesRef.current += 1;
    if (movesRef.current % SAMPLE_EVERY === 0) tryAutoReveal();
  };

  const endStroke = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    tryAutoReveal();
  };

  /* --------------------------------------------- 10s accessibility fallback */

  useEffect(() => {
    if (revealed) return;
    const node = wrapRef.current;
    if (!node) return;

    let timer = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !touchedRef.current && !doneRef.current) {
          timer = setTimeout(() => {
            if (!touchedRef.current && !doneRef.current) setShowFallback(true);
          }, FALLBACK_AFTER_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [revealed]);

  /* ------------------------------------------------------------------ view */

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        className="paper-card relative overflow-hidden"
        style={{
          width: CARD_W,
          height: CARD_H,
          maxWidth: '86vw',
          borderRadius: 12,
          borderColor: 'var(--gold)',
        }}
      >
        <CornerOrnaments inset={8} size={14} />

        {/* ---- revealed layer: real DOM, sits underneath ---- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '4rem',
              lineHeight: 1,
              color: 'var(--maroon)',
            }}
          >
            25th
          </span>
          <span className="mt-1" style={{ fontSize: '1.2rem', color: 'var(--olive)' }}>
            November 2026
          </span>
          <GoldRule className="my-2.5" width="2.25rem" />
          <span className="small-caps" style={{ color: 'var(--gold)' }}>
            The Aurum, Ghaziabad
          </span>
        </div>

        {/* ---- scratch surface ---- */}
        {!revealed && (
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
            aria-label="Scratch to reveal the date"
            className="absolute inset-0 h-full w-full"
            style={{
              // Without this, dragging on the canvas scrolls the page instead
              // of scratching — the single most important line in the file.
              touchAction: 'none',
              cursor: 'grab',
            }}
          />
        )}
      </div>

      {/* Fallback for trackpads and phones that never register the drag (§S2). */}
      {!revealed && showFallback && (
        <button
          type="button"
          onClick={() => reveal()}
          className="tappable small-caps mt-4"
          style={{
            color: 'var(--gold-text)',
            border: '1px solid var(--gold)',
            borderRadius: 999,
            padding: '0.55rem 1.4rem',
            minHeight: 44,
            background: 'transparent',
            animation: 'fade-in 400ms ease-out both',
          }}
        >
          Reveal
        </button>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fade-in { from { opacity: 1 } to { opacity: 1 } }
        }
      `}</style>
    </div>
  );
}
