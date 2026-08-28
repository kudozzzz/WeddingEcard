import { useCallback, useEffect, useState } from 'react';
import PaperTexture from './components/PaperTexture.jsx';
import Envelope, { OPEN_TIMING, prefersReducedMotion } from './components/Envelope.jsx';
import SaveTheDate from './components/SaveTheDate.jsx';
import Countdown from './components/Countdown.jsx';
import Events from './components/Events.jsx';
import Venues from './components/Venues.jsx';
import Wardrobe from './components/Wardrobe.jsx';
import Gallery from './components/Gallery.jsx';
import ThankYou from './components/ThankYou.jsx';
import MusicToggle from './components/MusicToggle.jsx';

/** sessionStorage can throw in private modes — never let that break the gate. */
const wasOpened = () => {
  try {
    return sessionStorage.getItem('envelopeOpened') === '1';
  } catch {
    return false;
  }
};

/**
 * Ankit & Srishti — one scrolling page, eight sections.
 *
 * App owns the gate: whether S1 renders at all, whether the body scrolls, and
 * the timing that hands off to S2. Envelope owns only its own animation.
 *
 * A guest returning to the link in the same session (sessionStorage) skips S1
 * entirely and lands on S2 with scroll already unlocked.
 */
export default function App() {
  // Read once, synchronously, so a reload never flashes the envelope.
  const [gateOpen, setGateOpen] = useState(wasOpened);
  const [scrollLocked, setScrollLocked] = useState(() => !wasOpened());

  useEffect(() => {
    if (!scrollLocked) return;
    // Lock html as well as body. The base stylesheet sets overflow-x:hidden on
    // body, which forces overflow-y to compute to auto — locking body alone
    // leaves the page scrollable. overscroll-behavior kills the rubber-band.
    const html = document.documentElement;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: document.body.style.overflow,
      overscroll: document.body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.overscrollBehavior = prev.overscroll;
    };
  }, [scrollLocked]);

  /**
   * Runs the moment the envelope is tapped, alongside its animation.
   *
   * The scroll handoff is deliberately two-stage. Unmounting S1 removes a full
   * viewport of content from above the scroll position, which would yank the
   * page. So: unlock and smooth-scroll to S2 while S1 is still mounted, then
   * once that scroll has landed (scrollTop is now ~S1's height), unmount S1 and
   * reset to 0 in the same frame. S2 does not move on screen.
   */
  const handleOpen = useCallback(() => {
    if (prefersReducedMotion()) {
      setScrollLocked(false);
      setGateOpen(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const scrollAt = OPEN_TIMING.envelopeDelay;                       // 500ms
    const unmountAt = OPEN_TIMING.envelopeDelay + OPEN_TIMING.envelope + 500; // 1500ms

    const t1 = setTimeout(() => {
      setScrollLocked(false);
      document
        .getElementById('save-the-date')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, scrollAt);

    const t2 = setTimeout(() => {
      setGateOpen(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, unmountAt);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      <PaperTexture />

      <main className="relative z-10">
        {!gateOpen && <Envelope onOpen={handleOpen} />}
        <SaveTheDate />
        <Countdown />
        <Events />
        <Venues />
        <Wardrobe />
        <Gallery />
        <ThankYou />
      </main>

      <MusicToggle />
    </>
  );
}
