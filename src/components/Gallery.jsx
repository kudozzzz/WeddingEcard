import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GALLERY_SIZES, buildLoop } from '../data/gallery.js';
import Reveal from './Reveal.jsx';
import { useVersion } from '../lib/version.jsx';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * S7 — Our Gallery.
 *
 * Infinite horizontal loop in both directions, using the clone technique: the
 * strip renders the last `lead` photos, then all of them, then the first
 * `lead`. When a scroll settles inside a clone zone, scrollLeft is silently
 * shifted by exactly one full set, which lands on the identical-looking real
 * card. Snapping and smooth scrolling are turned off for that single frame so
 * the reposition is invisible.
 *
 * Which photographs appear is the guest tier's (data/versions.js). EVERY count
 * below — set size, clone lead, loop length, dot count, lightbox wrap — is
 * derived from that resolved list, so four photos on one tier and six on
 * another run the identical code path with nothing special-cased.
 *
 * The owner's sequence is never reordered — only selected from, and wrapped.
 * gallery-3 is landscape; object-cover handles it, no special case.
 */
export default function Gallery() {
  const { photos } = useVersion();
  // photos is referentially stable — the version resolves once, at mount.
  const { lead, loop, realIndex } = useMemo(() => buildLoop(photos), [photos]);
  const set = photos.length;

  const [openAt, setOpenAt] = useState(null);
  const [active, setActive] = useState(0);
  const stripRef = useRef(null);
  const settleTimer = useRef(null);

  /**
   * Lightbox / strip interlock. All refs, never state: these are read inside
   * scroll handlers that must not re-render, and a state update would arrive a
   * render too late to suppress the very event that scheduled it.
   *
   * The bug being prevented (desktop only): the lightbox sets
   * body{overflow:hidden}, which removes the 15px vertical scrollbar, which
   * widens this strip's client box and makes the browser re-clamp its
   * scrollLeft. That fires a scroll event nobody asked for; the settle handler
   * sees a clone position and hops one full set; the hop fires another scroll
   * event; and it oscillates. Measured before the fix: 1920px back and forth,
   * every frame, ~80 times per open/close. Touch never hits it because overlay
   * scrollbars do not change the client width, so nothing reflows.
   */
  const suppressRef = useRef(false);       // lightbox open, or settling after close
  const repositioningRef = useRef(false);  // normalise() is mid-hop — ignore its own event
  const savedScrollRef = useRef(0);        // strip position captured at open
  const wasOpenRef = useRef(false);
  const unsuppressTimer = useRef(null);

  /** How long after close to keep ignoring scroll events. */
  const SETTLE_AFTER_CLOSE_MS = 150;

  /** Centre offset that puts a given figure in the middle of the viewport. */
  const centreOf = (fig, strip) =>
    fig.offsetLeft + fig.offsetWidth / 2 - strip.clientWidth / 2;

  /** Nearest strip position to the current scroll centre. */
  const nearestPos = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return lead;
    const centre = strip.scrollLeft + strip.clientWidth / 2;
    const figs = [...strip.querySelectorAll('figure')];
    let best = lead;
    let bestDist = Infinity;
    figs.forEach((fig, i) => {
      const d = Math.abs(fig.offsetLeft + fig.offsetWidth / 2 - centre);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, [lead]);

  /* Start on the first REAL image rather than on a leading clone. */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const figs = [...strip.querySelectorAll('figure')];
    if (figs.length <= lead) return;
    const prevBehavior = strip.style.scrollBehavior;
    strip.style.scrollBehavior = 'auto';
    repositioningRef.current = true;
    strip.scrollLeft = centreOf(figs[lead], strip);
    strip.style.scrollBehavior = prevBehavior;
    requestAnimationFrame(() => {
      repositioningRef.current = false;
    });
    setActive(0);
  }, [lead]);

  /**
   * If the scroll settled on a clone, hop one full set so we are on the real
   * card that looks identical. Snap must be disabled for the assignment or the
   * browser re-snaps and fights the jump; behaviour must be auto or the hop
   * animates and becomes visible.
   */
  const normalise = useCallback(() => {
    // Reentrancy guard. Without it the hop below fires a scroll event that
    // re-enters this function and hops back, forever.
    if (suppressRef.current || repositioningRef.current) return;
    const strip = stripRef.current;
    if (!strip) return;
    const figs = [...strip.querySelectorAll('figure')];
    if (figs.length < loop.length) return;

    const pos = nearestPos();
    setActive(realIndex(pos));

    // +/-1 whole set, not +/-`set` cards: setWidth below is already the width
    // of one whole set, so anything larger overshoots and slams into the
    // scroll boundary instead of hopping one period.
    let delta = 0;
    if (pos < lead) delta = 1;
    else if (pos >= lead + set) delta = -1;
    if (delta === 0) return;

    const setWidth = centreOf(figs[lead + set], strip) - centreOf(figs[lead], strip);
    const prevSnap = strip.style.scrollSnapType;
    const prevBehavior = strip.style.scrollBehavior;
    strip.style.scrollSnapType = 'none';
    strip.style.scrollBehavior = 'auto';
    repositioningRef.current = true;
    strip.scrollLeft += delta * setWidth;
    // Restore on the next frame; doing it synchronously can let the browser
    // re-snap against the old position and produce a visible twitch. The flag
    // clears here too, so the scroll event this hop just queued is ignored.
    requestAnimationFrame(() => {
      strip.style.scrollSnapType = prevSnap;
      strip.style.scrollBehavior = prevBehavior;
      repositioningRef.current = false;
    });
  }, [nearestPos, lead, set, loop.length, realIndex]);

  /**
   * scrollend where supported, debounced scroll everywhere else — scrollend is
   * missing on older iOS Safari, which is a large slice of this audience.
   */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const hasScrollEnd = 'onscrollend' in window;

    const onScroll = () => {
      // Covers the wheel and the touch paths alike: neither has a handler of
      // its own, both arrive here as a plain scroll event on the strip.
      if (suppressRef.current || repositioningRef.current) return;
      setActive(realIndex(nearestPos())); // keep dots live while dragging
      if (hasScrollEnd) return;
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(normalise, 140);
    };

    strip.addEventListener('scroll', onScroll, { passive: true });
    if (hasScrollEnd) strip.addEventListener('scrollend', normalise);
    return () => {
      strip.removeEventListener('scroll', onScroll);
      if (hasScrollEnd) strip.removeEventListener('scrollend', normalise);
      clearTimeout(settleTimer.current);
    };
  }, [normalise, nearestPos, realIndex]);

  /**
   * Opening. Capture the strip position SYNCHRONOUSLY, before React commits and
   * the lightbox locks the body — by the time an effect could run, the reflow
   * has already moved scrollLeft and the captured value would be the wrong one.
   */
  const openLightbox = useCallback((real) => {
    const strip = stripRef.current;
    if (strip) savedScrollRef.current = strip.scrollLeft;
    suppressRef.current = true;
    wasOpenRef.current = true;
    clearTimeout(unsuppressTimer.current);
    clearTimeout(settleTimer.current);
    setOpenAt(real);
  }, []);

  /**
   * Closing. This effect runs after the lightbox's own cleanup has put the body
   * styles back, so the scrollbar is present again and the strip has its final
   * width — only then is restoring scrollLeft meaningful.
   */
  useEffect(() => {
    if (openAt !== null) return;
    if (!wasOpenRef.current) return;   // first mount; there is nothing to restore
    wasOpenRef.current = false;

    const strip = stripRef.current;
    if (strip) {
      // Force the pending reflow to happen now, so scrollLeft is assigned
      // against the final layout rather than the scrollbar-less one.
      void strip.offsetWidth;
      const prevSnap = strip.style.scrollSnapType;
      const prevBehavior = strip.style.scrollBehavior;
      strip.style.scrollSnapType = 'none';
      strip.style.scrollBehavior = 'auto';   // never animate the restore
      strip.scrollLeft = savedScrollRef.current;
      requestAnimationFrame(() => {
        strip.style.scrollSnapType = prevSnap;
        strip.style.scrollBehavior = prevBehavior;
      });
    }

    // Keep ignoring scroll events a little longer: the body restore and the
    // window.scrollTo inside the lightbox cleanup both land after this frame.
    clearTimeout(unsuppressTimer.current);
    unsuppressTimer.current = setTimeout(() => {
      suppressRef.current = false;
    }, SETTLE_AFTER_CLOSE_MS);
  }, [openAt]);

  useEffect(() => () => clearTimeout(unsuppressTimer.current), []);

  return (
    <section id="gallery" className="section-y relative z-10">
      <Reveal as="h2" className="section-heading mb-10 px-6">
        Our Gallery
      </Reveal>

      <Reveal>
        <div
          ref={stripRef}
          className="hidden-scrollbar flex snap-x snap-mandatory overflow-x-auto px-6 pb-2"
          style={{ WebkitOverflowScrolling: 'touch', gap: '1rem' }}
        >
          {loop.map((src, pos) => {
            const size = GALLERY_SIZES[src];
            const real = realIndex(pos);
            const isClone = pos < lead || pos >= lead + set;
            return (
              <figure
                key={`${src}-${pos}`}
                className="tappable shrink-0 snap-center cursor-pointer overflow-hidden rounded-xl"
                style={{ width: '74vw', maxWidth: 320, border: '1px solid var(--gold)' }}
                role="button"
                tabIndex={isClone ? -1 : 0}
                aria-hidden={isClone || undefined}
                aria-label={`Open photograph ${real + 1} full screen`}
                onClick={() => openLightbox(real)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(real);
                  }
                }}
              >
                <img
                  src={src}
                  alt={isClone ? '' : `Ankit and Srishti, photograph ${real + 1}`}
                  width={size.w}
                  height={size.h}
                  loading={pos === lead ? 'eager' : 'lazy'}
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover"
                />
              </figure>
            );
          })}
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
          {photos.map((src, i) => (
            <span
              key={src}
              className="block rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: 'var(--gold)',
                opacity: i === active ? 1 : 0.3,
                transition: prefersReducedMotion() ? 'none' : 'opacity 250ms ease',
              }}
            />
          ))}
        </div>
      </Reveal>

      {openAt !== null && (
        <Lightbox photos={photos} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </section>
  );
}

/**
 * Full-screen viewer. Wraps in both directions, like the strip.
 *
 * Portalled to <body>: a Reveal ancestor carries a transform mid-animation,
 * and a transformed ancestor becomes the containing block for position:fixed,
 * which would trap this inside the section instead of filling the viewport.
 */
function Lightbox({ photos, startIndex, onClose }) {
  const [i, setI] = useState(startIndex);
  const touchX = useRef(null);
  const touchY = useRef(null);
  const reduced = prefersReducedMotion();

  /** Modulo both ways: past the last wraps to the first, and back again. */
  const go = useCallback((delta) => {
    setI((prev) => (prev + delta + photos.length) % photos.length);
  }, [photos.length]);

  /* Lock body scroll, and restore the exact position on close. */
  useEffect(() => {
    const y = window.scrollY;
    const body = document.body;
    // Width of the classic (layout-affecting) vertical scrollbar, 0 where
    // scrollbars are overlays. Hiding body overflow removes it, which would
    // widen every descendant by that much for as long as the lightbox is up —
    // and the horizontal strip in S7 answers a width change by re-clamping its
    // scrollLeft, i.e. by visibly lurching. Padding the same amount back keeps
    // the layout width identical, so nothing reflows at all.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      // Force a synchronous reflow so the document has its full height back
      // before we scroll — while body is fixed it collapses to viewport height.
      void body.offsetHeight;
      // behavior:'instant', NOT the default. The base stylesheet sets
      // html { scroll-behavior: smooth }, so a plain scrollTo animates the
      // restore and the guest watches the page glide back instead of simply
      // being where they were.
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const onTouchStart = (e) => {
    touchX.current = e.changedTouches[0].clientX;
    touchY.current = e.changedTouches[0].clientY;
  };

  /** Horizontal swipe pages; anything else falls through to tap-to-close. */
  const onTouchEnd = (e) => {
    if (touchX.current === null) return onClose();
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchX.current = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      e.stopPropagation();
      go(dx < 0 ? 1 : -1);
    } else {
      onClose();
    }
  };

  const size = GALLERY_SIZES[photos[i]];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${i + 1} of ${photos.length}`}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(20, 10, 6, 0.94)',
        touchAction: 'none',
        animation: reduced ? 'none' : 'lb-in 220ms ease-out',
      }}
    >
      <style>{`
        @keyframes lb-in { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { @keyframes lb-in { from { opacity: 1 } to { opacity: 1 } } }
      `}</style>

      <img
        key={photos[i]}
        src={photos[i]}
        alt={`Ankit and Srishti, photograph ${i + 1}`}
        width={size.w}
        height={size.h}
        decoding="async"
        className="max-h-[86vh] max-w-[92vw] object-contain"
        style={{ borderRadius: 8 }}
      />

      <div
        className="absolute inset-x-0 flex justify-center gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 22px)' }}
        aria-hidden="true"
      >
        {photos.map((src, n) => (
          <span
            key={src}
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: 'var(--gold-pale)',
              opacity: n === i ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="tappable absolute"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          right: 14,
          width: 44,
          height: 44,
          color: 'var(--gold-pale)',
          background: 'transparent',
          border: 'none',
          fontSize: '1.6rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}
