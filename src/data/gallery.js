/**
 * S7 gallery photographs, in the owner's display order.
 *
 * This array is the single source of truth: the strip's clone pattern, the dot
 * indicators and the lightbox wrap are all derived from its length. Adding or
 * removing a photo here is the whole change — nothing downstream is hardcoded
 * to a count.
 *
 * Do not reorder or sort (§12). Filenames are labels, not positions — the
 * array order is what matters, so gaps in the numbering are expected and must
 * not be "tidied" by renumbering the files.
 */
export const GALLERY = [
  '/img/gallery/gallery-1.webp',
  '/img/gallery/gallery-2.webp',
  '/img/gallery/gallery-3.webp',
  '/img/gallery/gallery-4.webp',
  '/img/gallery/gallery-6.webp',
  '/img/gallery/gallery-8.webp',
];

/**
 * Intrinsic pixel dimensions, rendered as explicit width/height so each photo
 * reserves its box before decode (kills CLS). gallery-3 is landscape;
 * object-cover handles it, no special case.
 */
export const GALLERY_SIZES = {
  '/img/gallery/gallery-1.webp': { w: 506, h: 900 },
  '/img/gallery/gallery-2.webp': { w: 676, h: 900 },
  '/img/gallery/gallery-3.webp': { w: 900, h: 599 },
  '/img/gallery/gallery-4.webp': { w: 675, h: 900 },
  '/img/gallery/gallery-6.webp': { w: 700, h: 900 },
  '/img/gallery/gallery-8.webp': { w: 600, h: 900 },
};

/** Clones prepended and appended to make the strip loop seamlessly. */
export const CLONE_LEAD = 2;

/**
 * '/img/gallery/gallery-6.webp' -> 6.
 *
 * The FILENAME number, which is not the array index: the set is 1,2,3,4,6,8,
 * so index 4 is gallery-6. A tier that selects [3,4,6,8] means those four
 * files, and resolving it any other way silently ships the wrong photographs.
 */
const numberOf = (src) => Number(src.match(/gallery-(\d+)\.webp$/)?.[1]);

const BY_NUMBER = new Map(GALLERY.map((src) => [numberOf(src), src]));

/**
 * Resolve a tier's `gallery` field (data/versions.js) to real photo paths.
 *
 *   'all'      -> the whole GALLERY, in its existing order
 *   [3, 4, 6]  -> those files, in the order listed
 *   false      -> none, and the section is not mounted at all
 *
 * A number with no matching file is skipped silently — gallery-5 and gallery-7
 * were removed from the set, and a stale reference must never render a gap or
 * throw in a guest's face.
 */
export function selectGallery(spec) {
  if (spec === 'all') return [...GALLERY];
  if (!Array.isArray(spec)) return [];
  return spec.map((n) => BY_NUMBER.get(n)).filter(Boolean);
}

/**
 * Build the infinite-loop strip for one tier's photo list.
 *
 * [last `lead`, ...all, first `lead`] — every count is derived, so four photos
 * on one tier and six on another use the identical code path. `lead` is capped
 * at the set size: with fewer photos than CLONE_LEAD, slice(-2) would repeat
 * the same photo twice in the lead and the seam maths would drift.
 */
export function buildLoop(photos) {
  const lead = Math.min(CLONE_LEAD, photos.length);
  return {
    lead,
    loop: [...photos.slice(-lead), ...photos, ...photos.slice(0, lead)],
    /** Map any strip position back to the real index in `photos`. */
    realIndex: (pos) => ((pos - lead) % photos.length + photos.length) % photos.length,
  };
}
