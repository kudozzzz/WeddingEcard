/**
 * Shared SVG furniture: gold rules, card corner ornaments, the per-event line-art
 * motifs, and the closing flourish. All vector, no image files (§7).
 *
 * The motifs are used in two places — the S4 event cards and the S6 wardrobe
 * tiles — so they live here rather than being duplicated in both.
 */

/** Horizontal gold rule with a centred dot. */
export function GoldRule({ className = '', width = '4.5rem', color = 'var(--gold)' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      <span style={{ width, height: 1, backgroundColor: color, opacity: 0.55 }} />
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <span style={{ width, height: 1, backgroundColor: color, opacity: 0.55 }} />
    </div>
  );
}

/** Gold rule with a small centred diamond — the Wedding tile's palette stand-in (§S6). */
export function GoldDiamondRule({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-2.5 ${className}`}
    >
      <span className="h-px flex-1" style={{ backgroundColor: 'var(--gold)', opacity: 0.45 }} />
      <span
        style={{
          width: 7,
          height: 7,
          backgroundColor: 'var(--gold)',
          transform: 'rotate(45deg)',
        }}
      />
      <span className="h-px flex-1" style={{ backgroundColor: 'var(--gold)', opacity: 0.45 }} />
    </div>
  );
}

/** Four thin gold brackets, one per card corner. */
export function CornerOrnaments({ inset = 8, size = 14, color = 'var(--gold)', opacity = 0.5 }) {
  const corners = [
    { top: inset, left: inset, borderTop: true, borderLeft: true },
    { top: inset, right: inset, borderTop: true, borderRight: true },
    { bottom: inset, left: inset, borderBottom: true, borderLeft: true },
    { bottom: inset, right: inset, borderBottom: true, borderRight: true },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: size,
            height: size,
            opacity,
            borderTop: c.borderTop ? `1px solid ${color}` : undefined,
            borderBottom: c.borderBottom ? `1px solid ${color}` : undefined,
            borderLeft: c.borderLeft ? `1px solid ${color}` : undefined,
            borderRight: c.borderRight ? `1px solid ${color}` : undefined,
          }}
        />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- motifs -- */

const motifProps = (color, size) => ({
  width: size,
  height: size,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: color,
  strokeWidth: 1.15,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
});

/** Sangeet — dholak with musical notes. */
function DholakMotif({ color, size }) {
  return (
    <svg {...motifProps(color, size)}>
      <ellipse cx="17" cy="30" rx="5" ry="9" />
      <ellipse cx="34" cy="30" rx="4" ry="7.5" />
      <path d="M17 21h17M17 39h17" />
      <path d="M19 24l13 1M19 28l13 0.6M19 32l13 0.6M19 36l13 1" opacity="0.6" />
      <path d="M28 14v-7l7-2v7" />
      <circle cx="26" cy="14" r="2.1" />
      <circle cx="33" cy="12" r="2.1" />
    </svg>
  );
}

/** Haldi — marigold flower. */
function MarigoldMotif({ color, size }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg {...motifProps(color, size)}>
      <g transform="translate(24 22)">
        {petals.map((deg) => (
          <ellipse key={deg} cx="0" cy="-9.5" rx="4.2" ry="6.4" transform={`rotate(${deg})`} />
        ))}
        <circle cx="0" cy="0" r="4.2" />
      </g>
      <path d="M24 34v9" />
      <path d="M24 39c-4 0-6.5-2-7.5-4.5 3.5-1 6.5 0.6 7.5 4.5z" />
    </svg>
  );
}

/** Wedding — kalash with mango leaves and a coconut. */
function KalashMotif({ color, size }) {
  return (
    <svg {...motifProps(color, size)}>
      <path d="M16 26c0 7 3.5 12 8 12s8-5 8-12c0-4-2-6-8-6s-8 2-8 6z" />
      <path d="M15 24h18" />
      <path d="M17.5 21l2-3.5h9l2 3.5" />
      <path d="M19.5 17.5c-3-1.5-5-4-5.5-7 3.5 0.5 6 2.5 7.5 5.5" />
      <path d="M28.5 17.5c3-1.5 5-4 5.5-7-3.5 0.5-6 2.5-7.5 5.5" />
      <ellipse cx="24" cy="12" rx="3.4" ry="4" />
      <path d="M24 8V5" />
      <path d="M18 31h12" opacity="0.55" />
    </svg>
  );
}

const MOTIFS = {
  sangeet: DholakMotif,
  haldi: MarigoldMotif,
  wedding: KalashMotif,
};

/** Line-art motif for an event id: dholak / marigold / kalash. */
export function EventMotif({ id, color = 'var(--gold)', size = 44 }) {
  const Motif = MOTIFS[id];
  if (!Motif) return null;
  return <Motif color={color} size={size} />;
}

/** Small closing flourish above the S8 heading. */
export function Flourish({ color = 'var(--gold)', width = 120 }) {
  return (
    <svg
      width={width}
      height={width * 0.25}
      viewBox="0 0 120 30"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 15c14 0 20-7 28-7s10 7 16 7" />
      <path d="M116 15c-14 0-20-7-28-7s-10 7-16 7" />
      <path d="M48 15c4 0 6 4 12 4s8-4 12-4" />
      <circle cx="60" cy="11" r="2.3" />
      <path d="M60 6V2" />
    </svg>
  );
}

/* ------------------------------------------------- S4 detail-row icons -- */

/**
 * Line-art icons for the S4 card detail rows. 14px, stroked in --gold at 70%.
 * Sized and coloured by the caller via currentColor / width.
 */
const rowIcon = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
});

export function CalendarIcon({ size = 14 }) {
  return (
    <svg {...rowIcon(size)}>
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.4" />
      <path d="M2 6.8h12M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

export function ClockIcon({ size = 14 }) {
  return (
    <svg {...rowIcon(size)}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.5V8l2.4 1.6" />
    </svg>
  );
}

export function GarmentIcon({ size = 14 }) {
  return (
    <svg {...rowIcon(size)}>
      <path d="M6.2 2l1.8 1.5L9.8 2l3.4 2.1-1.5 2.5-1.2-.7V14H4.5V5.9l-1.2.7L1.8 4.1z" />
    </svg>
  );
}

/** Map pin for the S5 Directions buttons. */
export function PinIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 14.5s5-4.6 5-8.2A5 5 0 0 0 3 6.3c0 3.6 5 8.2 5 8.2z" />
      <circle cx="8" cy="6.2" r="1.9" />
    </svg>
  );
}
