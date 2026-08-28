import { EVENTS } from '../data/events.js';
import { GoldDiamondRule, EventMotif } from './Ornaments.jsx';

/**
 * S6 — Wedding Wardrobe.
 *
 * Everything here is real HTML text and CSS circles. The PNGs in
 * reference/wardrobe-originals/ are colour/wording reference only and are
 * never rendered (§S6).
 *
 * Layout target: reference/inspiration/06-wardrobe-LAYOUT-TARGET.jpeg
 */
export default function Wardrobe() {
  return (
    <section id="wardrobe" className="relative z-10 px-6 py-20">
      <h2 className="section-heading">Wedding Wardrobe</h2>
      <p
        className="mx-auto mt-3 max-w-md text-center"
        style={{ fontStyle: 'italic', color: 'var(--olive)', fontSize: '1.05rem' }}
      >
        A little something to inspire your look for each celebration
      </p>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        {EVENTS.map((event) => (
          <WardrobeTile key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

/** '24th' + 'November 2026' -> '24 NOV' for the corner chip. */
function dateChip(event) {
  const day = event.dateShort.replace(/\D/g, '');
  const month = event.monthLabel.slice(0, 3).toUpperCase();
  return `${day} ${month}`;
}

function WardrobeTile({ event }) {
  return (
    <article
      className="paper-card relative rounded-[14px] px-6 pb-7 pt-6"
      style={{ borderColor: 'var(--paper-edge)' }}
    >
      {/* 1. date chip, top-right */}
      {/* The chip's own background is --paper, so its text sits on paper even
          though the chip is inside a card — --gold-text, not --gold (§3). */}
      <span
        className="small-caps absolute right-4 top-4 rounded-full px-2.5 py-1"
        style={{
          color: 'var(--gold-text)',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--paper-edge)',
        }}
      >
        {dateChip(event)}
      </span>

      {/* 2. motif, top-left */}
      <div className="mb-2">
        <EventMotif id={event.id} color={event.accent} size={38} />
      </div>

      {/* 3. event name */}
      <h3
        className="font-script"
        style={{ color: event.accent, fontSize: '2.2rem', lineHeight: 1.2 }}
      >
        {event.name}
      </h3>

      {/* 4. tagline */}
      <p style={{ fontStyle: 'italic', color: 'var(--olive)', fontSize: '1.02rem' }}>
        {event.tagline}
      </p>

      {/* 5 + 6. palette — or, when palette is null, a gold divider instead */}
      {event.palette ? (
        <>
          <div className="mt-5">
            <span className="small-caps" style={{ color: 'var(--gold)' }}>
              Palette
            </span>
            <span
              className="mt-1.5 block"
              style={{ width: '2rem', height: 1, backgroundColor: 'var(--gold)' }}
            />
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-4">
            {event.palette.map((colour) => (
              <li
                key={colour.name}
                className="flex flex-col items-center"
                style={{ width: 52 }}
              >
                <span
                  className="block shrink-0 rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    minWidth: 30,
                    minHeight: 30,
                    backgroundColor: colour.hex,
                    /* Essential: Warm Ivory is near-invisible on paper without it. */
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                  }}
                />
                <span
                  className="small-caps mt-1.5 text-center"
                  style={{ color: 'var(--olive)', fontSize: '0.6rem' }}
                >
                  {colour.name}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <GoldDiamondRule className="mt-6" />
      )}

      {/* 7. attire label */}
      <div className="mt-6">
        <span className="small-caps" style={{ color: 'var(--gold)' }}>
          Attire
        </span>
      </div>

      {/* 8. attire line */}
      <p className="mt-1.5" style={{ color: 'var(--ink)', fontSize: '1.05rem' }}>
        {event.attire}
      </p>
    </article>
  );
}
