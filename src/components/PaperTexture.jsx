/**
 * Page background — two stacked fixed layers, both behind all content (§3):
 *
 *   1. paper grain — inline feTurbulence at 3%
 *   2. gold jaal   — /img/pattern/jaal-paper.svg, tiled 150px, at 7%
 *
 * The jaal is a supplied, finished asset. Do not regenerate it procedurally and
 * do not replace it with inline floral geometry — see §3.
 */
export default function PaperTexture() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* grain, underneath */}
      <div className="absolute inset-0" style={{ opacity: 0.03 }}>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="paper-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper-grain)" />
        </svg>
      </div>

      {/* gold jaal, on top */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/img/pattern/jaal-paper.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
          opacity: 0.07,
        }}
      />
    </div>
  );
}
