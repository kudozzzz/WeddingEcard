import { GoldRule, Flourish } from './Ornaments.jsx';
import Reveal from './Reveal.jsx';

/**
 * S8 — Thank You. The site ends here.
 *
 * The sign-off is the last thing on the page — there is deliberately no
 * Add to Calendar link and no .ics download (§12).
 */
export default function ThankYou() {
  return (
    <section
      id="thank-you"
      className="relative z-10 flex flex-col items-center px-6 py-24 text-center"
    >
      <Reveal>
        <Flourish width={120} />
      </Reveal>

      <Reveal as="h2" className="section-heading mt-5" index={1}>
        With Love &amp; Gratitude
      </Reveal>

      <Reveal
        index={2}
        className="mt-6"
        style={{
          fontWeight: 300,
          color: 'var(--ink)',
          maxWidth: '34ch',
          lineHeight: 1.75,
          fontSize: '1.08rem',
        }}
      >
        <p>There are days a family waits for, and this is ours.</p>
        <p className="mt-4">
          As Ankit and Srishti begin their journey together, we would be honoured to
          have you beside us — for the music, the colours, the laughter, and every
          small moment in between.
        </p>
        <p className="mt-4">Your blessings are the finest gift we could ask for.</p>
        <p className="mt-4">Hope to see you there.</p>
      </Reveal>

      <Reveal index={3}>
        <GoldRule className="my-8" width="3rem" />
      </Reveal>

      {/* Italianno, not Great Vibes — otherwise "Anjali" reads as "anjali" (§3).
          ~20% up from the 1.9rem this would be in Great Vibes.
          This is the last thing on the page; nothing follows it. */}
      <Reveal as="p" index={4} className="font-signoff" style={{ color: 'var(--gold-text)', fontSize: '2.3rem' }}>
        Anjali &amp; Manish Kumar
      </Reveal>
    </section>
  );
}
