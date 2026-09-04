import { useState } from 'react';
import Reveal from './Reveal.jsx';
import { useVersion } from '../lib/version.jsx';
import { prefersReducedMotion } from '../lib/motion.js';
import {
  CornerOrnaments,
  EventMotif,
  CalendarIcon,
  ClockIcon,
  PinIcon,
  GarmentIcon,
  WatercolourWash,
} from './Ornaments.jsx';

/**
 * S4 — Wedding Events.
 *
 * Card structure, top to bottom (§S4):
 *   art panel (4:3) + CEREMONY n label -> motif -> event name + rule ->
 *   four detail rows (date / time / venue / attire)
 *
 * The art files at /img/events/event-<id>.webp are supplied separately and may
 * not exist yet. A missing file must degrade to the CSS watercolour wash rather
 * than showing a broken image — see ArtPanel.
 *
 * The venue photographs belong to S5 and must not appear here as well.
 *
 * Which events appear is the guest tier's (data/versions.js) — this section,
 * S5 and S6 all render from the same resolved list, so adding or removing an
 * event is a one-line change there and nothing here.
 */
export default function Events() {
  const { visibleEvents } = useVersion();

  return (
    <section id="events" className="section-y relative z-10 px-6">
      <Reveal as="h2" className="section-heading mb-10">
        Wedding Events
      </Reveal>

      <div className={`mx-auto grid gap-6 ${CARD_GRID[visibleEvents.length] ?? CARD_GRID[3]}`}>
        {visibleEvents.map((event, i) => (
          <Reveal key={event.id} index={i}>
            <EventCard event={event} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * Column count and container width follow the number of visible cards, so a
 * one- or two-event tier does not leave a card stranded in the left third of a
 * three-column grid. Each value is a whole literal class string — Tailwind
 * scans source text, so these must never be assembled from fragments.
 * Every width keeps the card at roughly the 368px it has in the 3-up layout.
 */
const CARD_GRID = {
  1: 'max-w-sm',
  2: 'max-w-3xl min-[900px]:grid-cols-2',
  3: 'max-w-6xl min-[900px]:grid-cols-3',
  // Four goes 2x2 rather than 4-up: a fourth column inside max-w-6xl would
  // squeeze every card to ~270px, and 3-up would strand the fourth alone on
  // a second row. 2x2 keeps the card at the same ~372px as the other tiers.
  4: 'max-w-3xl min-[900px]:grid-cols-2',
};

function EventCard({ event, index }) {
  return (
    <article className="paper-card relative overflow-hidden rounded-2xl">
      <ArtPanel event={event} index={index} />

      <div className="relative px-6 pb-7 pt-4">
        <CornerOrnaments inset={10} size={16} />

        {/* motif, then the event name and its rule */}
        <div className="flex flex-col items-center">
          <FloatingMotif id={event.id} accent={event.accent} />

          <h3
            className="font-script mt-1"
            style={{ color: event.accent, fontSize: '2.3rem', lineHeight: 1.15 }}
          >
            {event.name}
          </h3>

          <span
            className="mt-1 block"
            style={{ width: '2.75rem', height: 1, backgroundColor: 'var(--gold)', opacity: 0.6 }}
          />
        </div>

        {/* detail rows */}
        <dl className="mt-5 space-y-3">
          <DetailRow icon={<CalendarIcon />}>{event.dateLabel}</DetailRow>
          <DetailRow icon={<ClockIcon />}>{event.time}</DetailRow>
          <DetailRow icon={<PinIcon size={14} />}>
            <span style={{ fontWeight: 500 }}>{event.venue}</span>
            <br />
            <span style={{ color: 'var(--olive)' }}>{event.address}</span>
          </DetailRow>
          <DetailRow icon={<GarmentIcon />} italic>
            {event.attire}
          </DetailRow>
        </dl>
      </div>
    </article>
  );
}

/** One left-aligned icon + text row. */
function DetailRow({ icon, children, italic = false }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-[3px] shrink-0"
        style={{ color: 'var(--gold)', opacity: 0.7, lineHeight: 0 }}
      >
        {icon}
      </span>
      <dd
        className="m-0"
        style={{
          fontSize: '1rem',
          lineHeight: 1.45,
          color: italic ? 'var(--olive)' : 'var(--ink)',
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Art panel. Tries /img/events/event-<id>.webp first; if that 404s (the files
 * are dropped in later) onError swaps in the CSS watercolour wash, so the card
 * never shows a broken image. Once the files land they appear with no code
 * change.
 */
function ArtPanel({ event, index }) {
  const [artFailed, setArtFailed] = useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
      {artFailed ? (
        <WatercolourWash uid={`event-${event.id}`} accent={event.accent} />
      ) : (
        <img
          src={event.art}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setArtFailed(true)}
          className="h-full w-full object-cover"
        />
      )}

      {/* CEREMONY n — overlaid on the lower edge of the panel, right-aligned.
          Sits on a soft scrim so it stays readable over any artwork. */}
      <span
        className="small-caps absolute bottom-2.5 right-3 rounded-full px-2.5 py-1"
        style={{
          color: 'var(--gold)',
          backgroundColor: 'rgba(254,248,243,0.82)',
          border: '1px solid var(--paper-edge)',
        }}
      >
        Ceremony {index + 1}
      </span>
    </div>
  );
}

/**
 * Slow float, so the cards feel alive.
 *
 * Gated in JS as well as CSS: the media query alone covers real browsers, but
 * keeping the class off entirely means the animation never even starts.
 */
function FloatingMotif({ id, accent }) {
  const reduced = prefersReducedMotion();
  return (
    <>
      <style>{`
        @keyframes motif-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .motif-float { animation: motif-float 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .motif-float { animation: none; } }
      `}</style>
      <span className={reduced ? undefined : 'motif-float'} style={{ lineHeight: 0 }}>
        <EventMotif id={id} color={accent} size={34} />
      </span>
    </>
  );
}
