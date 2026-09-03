import { useCallback, useState } from 'react';
import ScratchCard from './ScratchCard.jsx';
import Reveal from './Reveal.jsx';
import InvitationViewer, { InvitationScroll } from './InvitationCard.jsx';

/**
 * S2 — Save the Date.
 *
 * Heading, then the scratch card. No date text above or around it (hard rule 1).
 *
 * Once the date is revealed, the traditional invitation card unrolls beneath it
 * and stays. There is no open control and nothing to dismiss — tapping the card
 * opens the full-screen zoom view, exactly like the S7 gallery photos.
 */
export default function SaveTheDate() {
  const [revealed, setRevealed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleReveal = useCallback(() => setRevealed(true), []);
  const openViewer = useCallback(() => setViewerOpen(true), []);

  return (
    <section
      id="save-the-date"
      className="section-y relative z-10 flex flex-col items-center px-6 pt-20"
    >
      <Reveal as="h2" className="section-heading mb-10">
        Save the Date
      </Reveal>

      <Reveal>
        <ScratchCard onReveal={handleReveal} />
      </Reveal>

      {/* Renders nothing until the date is revealed, and nothing at all if the
          image is missing. */}
      <InvitationScroll active={revealed} onOpenViewer={openViewer} />

      {viewerOpen && <InvitationViewer onClose={() => setViewerOpen(false)} />}
    </section>
  );
}
