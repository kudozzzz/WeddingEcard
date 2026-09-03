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
      className="section-y relative z-10 flex flex-col items-center px-6 pb-24 text-center"
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
          As Srishti and Ankit begin their journey together, we would be honoured to
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
        Anjali &amp; Manish
      </Reveal>

      {/* ---- invitation from ---- */}

      {/* Same separator as the one above "With Love & Gratitude". */}
      <Reveal index={5} className="mt-14">
        <Flourish width={120} />
      </Reveal>

      {/*
        Same treatment as the "With Love & Gratitude" heading (Great Vibes,
        --maroon) but smaller: this string is roughly three times the length and
        would wrap badly at the section-heading size. Sized to sit on two lines
        at 360px.
      */}
      <Reveal
        as="h2"
        index={6}
        className="font-script mt-5"
        style={{
          color: 'var(--maroon)',
          // Measured, not guessed: below 30px this string fits on ONE line at
          // 360px; the section heading is 36px there. 8.9vw lands at ~32px —
          // two balanced lines using the full column, clearly smaller than the
          // "With Love & Gratitude" heading above it.
          fontSize: 'clamp(2rem, 8.9vw, 2.5rem)',
          lineHeight: 1.45,
          textAlign: 'center',
        }}
      >
        Awaiting the pleasure of your presence
      </Reveal>

      {/* Flowing prose, not a list. Order exactly as given — not alphabetised,
          no titles, no "and" before the last name. */}
      <Reveal
        as="p"
        index={7}
        className="mt-5"
        style={{
          fontWeight: 300,
          color: 'var(--ink)',
          maxWidth: '34ch',
          lineHeight: 1.75,
          fontSize: '1.08rem',
        }}
      >
        Gautam Kumar, Kunal Rishi, Raj Kishore Sinha, Anant Sinha, Praveen Sinha,
        Kshitij, Aryan, Shubham, Satyam, Aditya, Rishav, Arnav, Naman &amp; the whole family.
      </Reveal>
    </section>
  );
}
