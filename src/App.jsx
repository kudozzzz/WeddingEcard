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
import { useResolvedVersion, VersionProvider } from './lib/version.jsx';

const TARGET_VOLUME = 0.35; // §6 — not 1.0
const FADE_MS = 1500;

/**
 * sessionStorage can throw in private modes — never let that break the gate.
 * Keys arriving here are already namespaced by version (see lib/version.jsx),
 * so no tier can read another tier's progress.
 */
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
  // Resolved once, from window.location.pathname, before any storage read —
  // every sessionStorage key below is namespaced by it.
  const version = useResolvedVersion();
  const sk = version.storageKey;

  const [gateOpen, setGateOpen] = useState(() => read(sk('envelopeOpened')) === '1');
  const [scrollLocked, setScrollLocked] = useState(() => read(sk('envelopeOpened')) !== '1');
  // `muted` is the guest's stored INTENT. `playing` is what the element is
  // actually doing. They are not the same thing: after a reload there is no
  // user gesture, so playback is refused and intent alone would make the
  // toggle claim to be playing while the page is silent.
  const [muted, setMuted] = useState(() => read(sk('muted')) === '1');
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const resumeRef = useRef(null);
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
        write(sk('muted'), '1');
      });
    }
  }, [sk]);

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

  const detachResume = useCallback(() => {
    if (resumeRef.current) {
      document.removeEventListener('pointerdown', resumeRef.current);
      resumeRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    // Decide from what the element is really doing, so the button always does
    // what its icon promises.
    const next = !el.paused;   // currently audible -> next state is muted
    setMuted(next);
    write(sk('muted'), next ? '1' : '0');
    // A manual mute cancels any armed first-tap resume.
    detachResume();

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
  }, [rampVolume, safePlay, detachResume, sk]);

  /* The button reflects reality, not intent: these events are the only thing
     that sets `playing`. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('play', onPlay);
    el.addEventListener('playing', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onPause);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('playing', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onPause);
    };
  }, []);

  /**
   * Resume after a reload.
   *
   * A reload skips the envelope (sessionStorage), so there is no user gesture
   * and play() is refused. That refusal is correct and must not be fought.
   * Instead, arm a one-shot listener so the guest's very first tap anywhere
   * resumes the track.
   */
  useEffect(() => {
    if (!gateOpen) return;          // the envelope tap handles the first visit
    if (read(sk('muted')) === '1') return;
    const el = audioRef.current;
    if (!el || !el.paused) return;

    let cancelled = false;
    const tryPlay = () => {
      const node = audioRef.current;
      if (cancelled || !node) return;
      node.volume = 0;
      const p = node.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      rampVolume(TARGET_VOLUME, FADE_MS);
    };

    // Optimistic first attempt — some browsers still allow it.
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (cancelled) return;
        resumeRef.current = tryPlay;
        document.addEventListener('pointerdown', tryPlay, { once: true });
      });
    }
    if (!el.paused) rampVolume(TARGET_VOLUME, FADE_MS);

    return () => {
      cancelled = true;
      detachResume();
    };
  }, [gateOpen, rampVolume, detachResume, sk]);

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
    <VersionProvider version={version}>
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
        {/* Absent entirely on the restricted tier — not hidden. An unmounted
            section renders no <img>, so none of its photographs are fetched. */}
        {version.gallery && <Gallery />}
        <ThankYou />
      </main>

      {!gateOpen && <Envelope onOpen={handleOpen} startAudio={startAudio} />}

      {/* Appears only after the envelope opens (§6). */}
      {gateOpen && <MusicToggle playing={playing} onToggle={toggleMute} />}
    </VersionProvider>
  );
}
