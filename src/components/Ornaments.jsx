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

/**
 * Madwa & Ghridhari — the mandap canopy raised before the wedding.
 *
 * Drawn in the same line-art idiom as the others: a draped canopy on four
 * posts, with a small finial. Deliberately not a kalash — that is the
 * Wedding motif and the two must not read as the same card.
 */
function MadwaMotif({ color, size }) {
  return (
    <svg {...motifProps(color, size)}>
      {/* canopy: a swagged cloth, not a straight roof */}
      <path d="M11 20c4.5-4 8.5-6 13-6s8.5 2 13 6" />
      <path d="M11 20c3 2.4 5.2 3.6 6.5 3.6S20.8 22.4 24 20c3.2 2.4 5.2 3.6 6.5 3.6S34 22.4 37 20" />
      {/* finial */}
      <path d="M24 14v-3.5" />
      <path d="M24 10.5c-1.4-1.1-2-2.3-1.8-3.7 1.4 0.3 2.3 1.2 2.6 2.6" />
      <path d="M24 10.5c1.4-1.1 2-2.3 1.8-3.7-1.4 0.3-2.3 1.2-2.6 2.6" />
      {/* four posts */}
      <path d="M12.5 21.5V38M18.5 23.5V38M29.5 23.5V38M35.5 21.5V38" />
      {/* ground */}
      <path d="M9 38h30" />
      {/* tied garland between the front posts */}
      <path d="M18.5 27c2 2.2 3.8 3.3 5.5 3.3S26 29.2 29.5 27" opacity="0.6" />
    </svg>
  );
}

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
  madwa: MadwaMotif,
  sangeet: DholakMotif,
  haldi: MarigoldMotif,
  wedding: KalashMotif,
};

/** Line-art motif for an event id: mandap / dholak / marigold / kalash. */
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


/* ============================================================ shared jaal ==
 * Ornament derived from the jaal's pointed-petal vocabulary. Defined once here
 * and reused by S2 and S3 — no new colours, fonts or image assets.
 * ========================================================================= */

/**
 * One pointed petal along +X: a point at the origin, swelling to `w` at the
 * midpoint, tapering to a point at `len`. Rotated into place by the caller.
 */
const petalPath = (len, w) =>
  `M0 0 Q${(len * 0.35).toFixed(2)} ${(-w / 2).toFixed(2)} ${len} 0 ` +
  `Q${(len * 0.35).toFixed(2)} ${(w / 2).toFixed(2)} 0 0 Z`;

/** Petals fanned evenly between two angles. */
const fan = (count, fromDeg, toDeg, len, w) =>
  Array.from({ length: count }, (_, i) => {
    const deg = fromDeg + ((toDeg - fromDeg) * i) / (count - 1);
    return <path key={deg} d={petalPath(len, w)} transform={`rotate(${deg})`} />;
  });

/**
 * Corner spray — two short petals, one long, and a bud, all fanning inward
 * from the corner. `corner` mirrors it into place.
 */
export function CornerSpray({ scale = 1, corner = 'tl', color = 'var(--gold)' }) {
  const flip = {
    tl: 'none',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1, -1)',
  }[corner];
  const size = 26 * scale;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      stroke={color}
      strokeWidth="0.9"
      strokeLinejoin="round"
      opacity="0.72"
      style={{ transform: flip === 'none' ? undefined : flip }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g vectorEffect="non-scaling-stroke">
        <path d={petalPath(15, 4.4)} transform="rotate(32)" vectorEffect="non-scaling-stroke" />
        <path d={petalPath(15, 4.4)} transform="rotate(58)" vectorEffect="non-scaling-stroke" />
        <path d={petalPath(23, 3.2)} transform="rotate(45)" vectorEffect="non-scaling-stroke" />
        <path d={petalPath(7, 2.4)} transform="rotate(45)" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** Lotus crest — five fanned petals, a base circle, and a shallow arc beneath. */
export function LotusCrest({ scale = 1, color = 'var(--gold)' }) {
  const w = 40 * scale;
  const h = 28 * scale;
  return (
    <svg
      width={w}
      height={h}
      viewBox="-20 -20 40 28"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinejoin="round"
      opacity="0.8"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g vectorEffect="non-scaling-stroke">
        {fan(5, -170, -10, 17, 5)}
        <circle cx="0" cy="0" r="1.7" vectorEffect="non-scaling-stroke" />
        {/* shallow arc beneath, spanning 32 */}
        <path d="M-16 4 Q0 8.4 16 4" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/** Floret — the crest without the arc, for the break in the S3 tile rule. */
export function Floret({ scale = 1, color = 'var(--gold)' }) {
  const w = 30 * scale;
  const h = 18 * scale;
  return (
    <svg
      width={w}
      height={h}
      viewBox="-15 -15 30 18"
      fill="none"
      stroke={color}
      strokeWidth="0.9"
      strokeLinejoin="round"
      opacity="0.8"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g vectorEffect="non-scaling-stroke">
        {fan(5, -170, -10, 13, 3.8)}
        <circle cx="0" cy="0" r="1.3" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/**
 * The page jaal at 5%, clipped to the element's radius. Sits above the card
 * background and below all content — content needs its own stacking context.
 */
export function JaalWatermark({ radius = 0 }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: 'url(/img/pattern/jaal-paper.svg)',
        backgroundRepeat: 'repeat',
        backgroundSize: '150px 150px',
        opacity: 0.05,
        borderRadius: radius,
        zIndex: 0,
      }}
    />
  );
}

/**
 * Watercolour wash — layered radial gradients in the event accent, pushed
 * through a displacement map so the edges bleed like paint rather than ending
 * on a straight line.
 *
 * Two callers, two jobs: S4 falls back to it when an event's art file is
 * missing, and S5 uses it deliberately for a venue that has no photograph (a
 * private home). `uid` must be unique per instance — the same event rendered in
 * both sections would otherwise emit duplicate SVG def ids, and every
 * url(#...) in the document would resolve to whichever painted first.
 */
export function WatercolourWash({ uid, accent }) {
  const gradId = `wash-${uid}`;
  const filterId = `torn-${uid}`;
  const seed = [...uid].reduce((a, c) => a + c.charCodeAt(0), 0) % 97;

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
            seed={seed}
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

      {/* Flat base tint so the panel fills edge to edge — the displaced blobs
          alone leave card-coloured gaps at the corners. */}
      <rect width="320" height="240" fill={accent} opacity="0.10" />

      <g filter={`url(#${filterId})`}>
        <ellipse cx="150" cy="120" rx="170" ry="130" fill={`url(#${gradId}-a)`} />
        <ellipse cx="205" cy="140" rx="140" ry="110" fill={`url(#${gradId}-b)`} />
        <ellipse cx="160" cy="76" rx="120" ry="86" fill={`url(#${gradId}-c)`} />
      </g>
    </svg>
  );
}
