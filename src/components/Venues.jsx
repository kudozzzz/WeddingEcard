import { useMemo } from 'react';
import { IMAGE_SIZES } from '../data/events.js';
import Reveal from './Reveal.jsx';
import { useVersion } from '../lib/version.jsx';
import { CornerOrnaments, PinIcon } from './Ornaments.jsx';

/**
 * S5 — The Venue.
 *
 * Same card shell as S4. Photos carry explicit width/height so the box is
 * reserved before decode, and everything below the fold is lazy (§7).
 *
 * One tile per visible event that HAS A VENUE PHOTOGRAPH. The list is still
 * derived from the tier's events (data/versions.js), never held separately, so a
 * venue can never outlive the event that hosts it — it is simply narrowed by one
 * more condition.
 *
 * That condition is `photo`, not an id: Madwa is held at a private home and has
 * `photo: null`, so it drops out on its own, and any future event without a venue
 * photograph does the same with no code change. The event itself still appears in
 * full in S4 and S6 — only this section is about places you travel to.
 */
export default function Venues() {
  const { visibleEvents } = useVersion();
  const venues = useMemo(
    () => visibleEvents.filter((event) => event.photo),
    [visibleEvents],
  );

  return (
    <section id="venues" className="section-y relative z-10 px-6">
      <Reveal as="h2" className="section-heading mb-10">
        The Venue
      </Reveal>

      <div className={`mx-auto grid gap-6 ${VENUE_GRID[venues.length] ?? VENUE_GRID[3]}`}>
        {venues.map((event, i) => (
          <Reveal key={event.id} index={i}>
            <VenueTile event={event} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Same shell as S4, so the same width ladder. See CARD_GRID in Events.jsx. */
const VENUE_GRID = {
  1: 'max-w-sm',
  2: 'max-w-3xl min-[900px]:grid-cols-2',
  3: 'max-w-6xl min-[900px]:grid-cols-3',
  4: 'max-w-3xl min-[900px]:grid-cols-2',
};

function VenueTile({ event }) {
  // Guaranteed present: Venues filters on `photo` before rendering any tile.
  const size = IMAGE_SIZES[event.photo];

  return (
    <article className="paper-card relative overflow-hidden rounded-2xl">
      <img
        src={event.photo}
        alt={event.venue}
        width={size.w}
        height={size.h}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] w-full rounded-t-2xl object-cover"
      />

      <div className="relative px-6 pb-7 pt-5 text-center">
        <CornerOrnaments inset={10} size={16} />

        <h3
          className="font-script"
          style={{ color: event.accent, fontSize: '2.1rem', lineHeight: 1.2 }}
        >
          {event.venue}
        </h3>

        <p className="small-caps mt-1.5" style={{ color: 'var(--gold)' }}>
          {event.name}
        </p>

        <p className="mt-3" style={{ fontSize: '0.98rem', color: 'var(--olive)' }}>
          {event.address}
        </p>

        {/* Fill state is CSS-only (.btn-directions). It used to be set from
            onMouseEnter/onMouseLeave, which is what left the button stuck
            highlighted: on touch, mouseenter fires on tap and mouseleave never
            arrives once Maps takes over, so the inline style persisted. */}
        <a
          href={event.maps}
          target="_blank"
          rel="noopener noreferrer"
          className="tappable btn-directions small-caps mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5"
          style={{ minHeight: 44 }}
        >
          <PinIcon size={12} />
          Directions
        </a>
      </div>
    </article>
  );
}
