import ScratchCard from './ScratchCard.jsx';

/**
 * S2 — Save the Date.
 *
 * Heading, then the scratch card. Nothing else — no date text above or around
 * it (hard rule 1).
 */
export default function SaveTheDate() {
  return (
    <section
      id="save-the-date"
      className="relative z-10 flex flex-col items-center px-6 py-20"
    >
      <h2 className="section-heading mb-10">Save the Date</h2>
      <ScratchCard />
    </section>
  );
}
