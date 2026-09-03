import { useState } from 'react';
import { EVENTS } from '../data/events.js';
import Reveal from './Reveal.jsx';
import { prefersReducedMotion } from '../lib/motion.js';
import {
  CornerOrnaments,
  EventMotif,
  CalendarIcon,
  ClockIcon,
  PinIcon,
  GarmentIcon,
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
 */
export default function Events() {
  return (
    <section id="events" className="section-y relative z-10 px-6">
      <Reveal as="h2" className="section-heading mb-10">
        Wedding Events
      </Reveal>

      <div className="mx-auto grid max-w-6xl gap-6 min-[900px]:grid-cols-3">
        {EVENTS.map((event, i) => (
          <Reveal key={event.id} index={i}>
            <EventCard event={event} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

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
        <WatercolourWash id={event.id} accent={event.accent} />
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

/**
 * Fallback panel: layered radial gradients in the event accent, pushed through
 * a displacement map so the edges bleed like paint rather than ending on a
 * straight line. Used only when the art file is missing.
 */
function WatercolourWash({ id, accent }) {
  const gradId = `wash-${id}`;
  const filterId = `torn-${id}`;

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 320 240"
      preserveAspectRatio="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${gradId}-a`} cx="30%" cy="42%" r="62%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.30" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${gradId}-b`} cx="72%" cy="58%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${gradId}-c`} cx="52%" cy="26%" r="46%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>

        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.03"
            numOctaves="3"
            seed={id.length * 7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {/* Flat base tint so the placeholder fills the panel edge to edge — the
          displaced blobs alone leave card-coloured gaps at the corners, which
          makes the CEREMONY label look like it is floating on nothing. */}
      <rect width="320" height="240" fill={accent} opacity="0.10" />

      <g filter={`url(#${filterId})`}>
        <ellipse cx="150" cy="120" rx="170" ry="130" fill={`url(#${gradId}-a)`} />
        <ellipse cx="205" cy="140" rx="140" ry="110" fill={`url(#${gradId}-b)`} />
        <ellipse cx="160" cy="76" rx="120" ry="86" fill={`url(#${gradId}-c)`} />
      </g>
    </svg>
  );
}
