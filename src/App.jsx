import { useCallback, useEffect, useRef, useState } from 'react';
import PaperTexture from './components/PaperTexture.jsx';
import Envelope, { T, prefersReducedMotion } from './components/Envelope.jsx';
import SaveTheDate from './components/SaveTheDate.jsx';
import Countdown from './components/Countdown.jsx';
import Events from './components/Events.jsx';
import Venues from './components/Venues.jsx';
import Wardrobe from './components/Wardrobe.jsx';
import Gallery from './components/Gallery.jsx';
import ThankYou from './components/ThankYou.jsx';
import MusicToggle from './components/MusicToggle.jsx';

const TARGET_VOLUME = 0.35; // §6 — not 1.0
const FADE_MS = 1500;

/** sessionStorage can throw in private modes — never let that break the gate. */
const read = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

/**
 * Ankit & Srishti — one scrolling page.
 *
 * App owns the gate and the audio element. S1 is a fixed overlay (see
 * Envelope), so S2..S8 are the document from the first paint and the document
 * height never changes when the gate leaves. There is deliberately no
 * scroll-to-S2: the guest is already at the top.
 *
 * AUDIO (§6) — the element plays the file and its volume is ramped. That is the
 * whole feature. There is deliberately NO Web Audio graph: routing through an
 * AudioContext whose sample rate does not match the file's 44.1kHz makes some
 * browsers resample badly, which is heard as a pitch shift. `volume` is a plain
 * gain multiplier on the element's output and cannot alter pitch.
 *
 * Do not add an AudioContext, a GainNode, a filter, a limiter or any other
 * processing here.
 */
export default function App() {
  const [gateOpen, setGateOpen] = useState(() => read('envelopeOpened') === '1');
  const [scrollLocked, setScrollLocked] = useState(() => read('envelopeOpened') !== '1');
  const [muted, setMuted] = useState(() => read('muted') === '1');

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  // Ref, not state: this must be readable and settable synchronously inside the
  // tap handler, before any re-render could let a second call through.
  const startedRef = useRef(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  /* ------------------------------------------------------------ scroll lock */

  useEffect(() => {
    if (!scrollLocked) return;
    // Lock html as well as body: the base stylesheet sets overflow-x:hidden on
    // body, which forces overflow-y to compute to auto, so locking body alone
    // leaves the page scrollable.
    const html = document.documentElement;
    const prev = {
      html: html.style.overflow,
      body: document.body.style.overflow,
      overscroll: document.body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
      document.body.style.overscrollBehavior = prev.overscroll;
    };
  }, [scrollLocked]);

  /* ----------------------------------------------------------------- audio  */

  const cancelRamp = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /**
   * Ramp element volume with requestAnimationFrame — ~90 fine steps over 1.5s,
   * rather than the coarse setInterval steps that caused zipper noise.
   */
  const rampVolume = useCallback((target, ms) => {
    cancelRamp();
    const el = audioRef.current;
    if (!el) return;
    const from = el.volume;
    const t0 = performance.now();
    const tick = (now) => {
      const node = audioRef.current;
      if (!node) return cancelRamp();
      const k = Math.min(1, (now - t0) / ms);
      node.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
      else cancelRamp();
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const safePlay = useCallback((el) => {
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        setMuted(true);
        write('muted', '1');
      });
    }
  }, []);

  /**
   * Called synchronously from the envelope tap handler (§6). That tap is the
   * gesture that unlocks playback; anything async first and the browser
   * refuses. A rejected promise must never throw.
   *
   * startedRef makes this idempotent: even if the tap handler were somehow
   * invoked twice, the start path runs exactly once.
   */
  const startAudio = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (mutedRef.current) return;

    const el = audioRef.current;
    if (!el) return;
    el.volume = 0;
    safePlay(el);
    rampVolume(TARGET_VOLUME, FADE_MS);
  }, [rampVolume, safePlay]);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    const next = !mutedRef.current;
    setMuted(next);
    write('muted', next ? '1' : '0');
    if (!el) return;

    if (next) {
      // Short ramp down, then pause — cutting volume dead also clicks.
      rampVolume(0, 180);
      window.setTimeout(() => {
        if (mutedRef.current) el.pause();
      }, 200);
    } else {
      el.volume = 0;
      safePlay(el);
      rampVolume(TARGET_VOLUME, FADE_MS);
    }
  }, [rampVolume, safePlay]);

  useEffect(() => cancelRamp, []);

  /* ------------------------------------------------------------------ gate  */

  const handleOpen = useCallback(() => {
    if (prefersReducedMotion()) {
      setScrollLocked(false);
      setGateOpen(true);
      return;
    }
    // Unlock as the envelope dissolves, then drop the overlay when the
    // sequence ends. No scroll call anywhere — the document never moved.
    const t1 = setTimeout(() => setScrollLocked(false), T.liftStart);
    const t2 = setTimeout(() => setGateOpen(true), T.total);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      <PaperTexture />

      {/* Mounted ONCE, here, at a fixed position among its siblings so React
          never remounts it. Two elements playing the same track a fraction of a
          second apart comb-filter, which is heard as pitch bending.
          preload="none" keeps the file off the critical path until the tap. */}
      <audio ref={audioRef} src="/audio/theme.mp3" preload="none" loop playsInline />

      <main className="relative z-10">
        <SaveTheDate />
        <Countdown />
        <Events />
        <Venues />
        <Wardrobe />
        <Gallery />
        <ThankYou />
      </main>

      {!gateOpen && <Envelope onOpen={handleOpen} startAudio={startAudio} />}

      {/* Appears only after the envelope opens (§6). */}
      {gateOpen && <MusicToggle muted={muted} onToggle={toggleMute} />}
    </>
  );
}
