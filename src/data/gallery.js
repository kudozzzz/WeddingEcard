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
 * [last two, ...all, first two] — derived, never hardcoded.
 * With eight photos: 7,8,1,2,3,4,5,6,7,8,1,2
 */
export const LOOP = [
  ...GALLERY.slice(-CLONE_LEAD),
  ...GALLERY,
  ...GALLERY.slice(0, CLONE_LEAD),
];

/** Map any strip position back to the real index in GALLERY. */
export const realIndex = (pos) =>
  ((pos - CLONE_LEAD) % GALLERY.length + GALLERY.length) % GALLERY.length;
