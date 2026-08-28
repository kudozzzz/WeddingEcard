import { GALLERY, IMAGE_SIZES } from '../data/events.js';

/**
 * S7 — Our Gallery.
 *
 * Horizontal snap-scroll strip. The four cards are in the owner's chosen
 * sequence — not reordered or sorted.
 *
 * BUILD STEP 1: the full-screen lightbox and the live scroll-position dot
 * tracking land in build step 7 (§10). The dots render statically for now.
 *
 * gallery-3 is landscape; object-cover handles it, no special case.
 */
export default function Gallery() {
  return (
    <section id="gallery" className="relative z-10 py-20">
      <h2 className="section-heading mb-10 px-6">Our Gallery</h2>

      <div
        className="hidden-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GALLERY.map((src, i) => {
          const size = IMAGE_SIZES[src];
          return (
            <figure
              key={src}
              className="shrink-0 snap-center overflow-hidden rounded-xl"
              style={{
                width: '74vw',
                maxWidth: 320,
                border: '1px solid var(--gold)',
              }}
            >
              <img
                src={src}
                alt={`Ankit and Srishti, photograph ${i + 1}`}
                width={size.w}
                height={size.h}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="aspect-[3/4] w-full object-cover"
              />
            </figure>
          );
        })}

        {/* Trailing spacer so the last card can settle centred rather than
            being pinned to the right edge. */}
        <div aria-hidden="true" className="shrink-0" style={{ width: '13vw' }} />
      </div>

      <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
        {GALLERY.map((src, i) => (
          <span
            key={src}
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: 'var(--gold)',
              opacity: i === 0 ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </section>
  );
}
