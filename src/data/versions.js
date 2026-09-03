import { EVENTS } from './events.js';

/**
 * Guest-tier versions — ONE codebase, ONE deploy, three URLs.
 *
 * Keyed by URL path. TOKEN_A and TOKEN_B are literal placeholders; the owner
 * substitutes the real values here and nowhere else. Everything downstream —
 * which events, which venues, which wardrobe tiles, whether the gallery exists,
 * and the sessionStorage namespace — is derived from this map, so a new tier or
 * a changed event list is a one-line edit.
 *
 * `events` lists event ids. It is a MEMBERSHIP set, not a running order: the
 * visible list is always rebuilt in the canonical EVENTS order
 * (Sangeet -> Haldi -> Wedding, CLAUDE.md §2), so nothing here can reorder the
 * page by accident.
 */
export const VERSIONS = {
  '/':        { events: ['wedding'],                     gallery: false },
  '/TOKEN_A': { events: ['sangeet', 'wedding'],           gallery: true  },
  '/TOKEN_B': { events: ['sangeet', 'haldi', 'wedding'],  gallery: true  },
};

/** Anything unrecognised falls back to the most restricted version. */
export const FALLBACK_PATH = '/';

/**
 * '/TOKEN_A/' and '/TOKEN_A' are the same link as far as a guest is concerned —
 * WhatsApp and hand-typed URLs both produce trailing slashes. Everything else
 * (case, query, hash) is left alone: the tokens are exact strings, and a near
 * miss must fall back rather than half-match.
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

  return {
    path: key,
    gallery: config.gallery,

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
