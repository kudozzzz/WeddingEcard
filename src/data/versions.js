import { EVENTS } from './events.js';
import { selectGallery } from './gallery.js';

/**
 * Guest-tier versions — ONE codebase, ONE deploy, three URLs.
 *
 * Keyed by URL path. Everything downstream — which events, which venues, which
 * wardrobe tiles, which gallery photographs, and the sessionStorage namespace —
 * is derived from this map, so a new tier or a changed list is a one-line edit.
 *
 * `events` lists event ids. It is a MEMBERSHIP set, not a running order: the
 * visible list is always rebuilt in the canonical EVENTS order
 * (Sangeet -> Haldi -> Wedding, CLAUDE.md §2), so nothing here can reorder the
 * page by accident.
 *
 * `gallery` is 'all', an array of FILENAME numbers, or false:
 *
 *   'all'        the whole GALLERY, in its existing order
 *   [3, 4, 6, 8] those four files, in the order listed
 *   false        the section is not mounted at all, and fetches nothing
 *
 * The numbers are filenames, NOT array indices — the set is 1,2,3,4,6,8, so
 * index 5 is not gallery-6. See selectGallery in data/gallery.js.
 */
export const VERSIONS = {
  '/':  { events: ['madwa', 'sangeet', 'haldi', 'wedding'], gallery: 'all' },
  '/2': { events: ['sangeet', 'wedding'],          gallery: [3, 4, 6, 8] },
  '/1': { events: ['wedding'],                     gallery: false },
};

/** Anything unrecognised falls back to '/'. */
export const FALLBACK_PATH = '/';

/**
 * '/2/' and '/2' are the same link as far as a guest is concerned — WhatsApp
 * and hand-typed URLs both produce trailing slashes. Everything else (case,
 * query, hash) is left alone: the keys are exact strings, and a near miss must
 * fall back rather than half-match.
 */
function normalise(pathname) {
  if (typeof pathname !== 'string' || pathname === '') return FALLBACK_PATH;
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? FALLBACK_PATH : trimmed;
}

/**
 * Resolve a pathname to a fully-derived version.
 *
 * Pure: takes the pathname, touches no globals. The caller reads
 * window.location.pathname once, at mount (see lib/version.jsx).
 */
export function resolveVersion(pathname) {
  const path = normalise(pathname);
  const key = Object.prototype.hasOwnProperty.call(VERSIONS, path) ? path : FALLBACK_PATH;
  const config = VERSIONS[key];
  const allowed = new Set(config.events);

  // Resolved to real paths here, so no component ever handles the raw spec.
  // An empty result (false, or numbers that match no file) means the section is
  // not mounted at all — never an empty strip.
  const photos = selectGallery(config.gallery);

  return {
    path: key,
    photos,
    gallery: photos.length > 0,

    /* The single list S4, S5 and S6 all render from. Filtered from EVENTS, so
       it keeps the canonical order regardless of how `events` above is written. */
    visibleEvents: EVENTS.filter((event) => allowed.has(event.id)),

    /**
     * Namespaced sessionStorage key.
     *
     * Every version has its own gate, date reveal, farmaan and mute state. The
     * version itself is NEVER stored — it is resolved from the URL on every
     * load — so opening a second link can neither inherit the first link's
     * progress nor, more importantly, show the wrong tier's content.
     */
    storageKey: (name) => `${key}|${name}`,
  };
}
