# CLAUDE.md — Ankit & Srishti Wedding E-Invite

You are building a single-page interactive wedding invitation website. Read this file
completely before writing any code. Everything in it is decided — do not re-open settled
decisions, do not ask the user to re-confirm event details, and do not "improve" the UX
flow. Build what is specified.

---

## 1. Project facts

| | |
|---|---|
| **Couple** | Ankit & Srishti (in that order, always) |
| **Monogram** | `AS` — calligraphy, appears on the envelope wax seal |
| **Hosts** | Anjali & Manish |
| **Surnames** | **Never print surnames for the couple.** Only "Ankit" and "Srishti" |
| **Audience** | ~350–400 guests, Delhi NCR, majority on mid-range Android over 4G |
| **Primary surface** | Opened from a WhatsApp message. Assume WhatsApp's in-app WebView, not Chrome |
| **Language** | English only |
| **Deploy** | Vercel, free `.vercel.app` subdomain. No custom domain |
| **RSVP** | None. Do not add one |

### Hard rules (violating these means a rebuild)

1. **The wedding date must NOT appear as static text anywhere in sections 1–2.** It is
   revealed by the scratch card in §S2. This is a deliberate design choice by the owner.
   The date does appear normally in §S4 (Events), §S6 (Wardrobe), and the countdown target.
2. **The OG / link-preview image must not show the date either** — otherwise WhatsApp spoils
   the scratch reveal before anyone opens the link. The supplied `og-image.jpg` is already
   date-free. Do not replace it with one that has the date.
3. `<meta name="robots" content="noindex, nofollow">` in `index.html`. This page has two
   families' names, four photographs, and three addresses with dates and times on them. It
   is shareable by link and invisible to search engines.
4. No RSVP, no guest name personalisation, no login, no backend, no database, no analytics.

---

## 2. Event data (canonical — copy exactly)

```js
export const EVENTS = [
  {
    id: 'sangeet',
    name: 'Sangeet',
    tagline: 'An Evening of Elegance',
    dateLabel: '24th November 2026',
    dateShort: '24th',
    monthLabel: 'November 2026',
    time: '7:00 PM onwards',
    venue: 'Evara',
    address: 'Sector 10, Vasundhara, Ghaziabad',
    maps: 'https://maps.app.goo.gl/vdwCAA9Pc4nJNnjZ7',
    photo: '/img/venue/venue-evara.webp',
    art: '/img/events/event-sangeet.webp',
    accent: '#1D234F',
    attire: 'Regal silhouettes, embellished details, jewel tones',
    palette: [
      { name: 'Warm Ivory',     hex: '#F0E8D6' },
      { name: 'Emerald Green',  hex: '#0F5031' },
      { name: 'Royal Blue',     hex: '#23349C' },
      { name: 'Midnight Blue',  hex: '#1A1F4B' },
      { name: 'Deep Plum',      hex: '#492352' },
      { name: 'Wine',           hex: '#5B1A2D' },
      { name: 'Charcoal Black', hex: '#232326' },
    ],
  },
  {
    id: 'haldi',
    name: 'Haldi',
    tagline: 'A Morning Drenched in Sunshine',
    dateLabel: '25th November 2026',
    dateShort: '25th',
    monthLabel: 'November 2026',
    time: '11:00 AM onwards',
    venue: 'Caracalla Club, Orange County',
    address: 'Orange County, Indirapuram, Ghaziabad',
    maps: 'https://maps.app.goo.gl/v2QjHyHojfxF81Za8',
    photo: '/img/venue/venue-caracalla.webp',
    art: '/img/events/event-haldi.webp',
    accent: '#C8891A',
    attire: 'Bright festive hues of turmeric and gold',
    palette: [
      { name: 'Golden Yellow',  hex: '#FBD867' },
      { name: 'Mustard Yellow', hex: '#EFC63F' },
      { name: 'Honey Yellow',   hex: '#F2AE1C' },
      { name: 'Marigold',       hex: '#F49C1A' },
    ],
  },
  {
    id: 'wedding',
    name: 'Wedding',
    tagline: 'The Sacred Union',
    dateLabel: '25th November 2026',
    dateShort: '25th',
    monthLabel: 'November 2026',
    time: '7:30 PM onwards',
    venue: 'The Aurum',
    address: 'Raj Nagar Extension, Ghaziabad',
    maps: 'https://maps.app.goo.gl/CuZSHZ6LDN7vEdaJ7',
    photo: '/img/venue/venue-aurum.webp',
    art: '/img/events/event-wedding.webp',
    accent: '#791D2A',
    attire: 'Dress in your wedding finest',
    palette: null,   // intentional — see §S6
  },
];

export const COUNTDOWN_TARGET = '2026-11-25T19:30:00+05:30';
```

Order is always **Sangeet → Haldi → Wedding**. Sangeet is the evening before; Haldi is the
morning of the wedding day. That is correct, do not "fix" it.

The Wedding entry has `palette: null` on purpose — the instruction is "dress in your wedding
finest", i.e. no colour restriction. Handle the null case, don't invent a palette.

---

## 3. Design tokens

```css
:root {
  /* surfaces */
  --paper:        #F7DAC6;   /* page background — peach */
  --paper-deep:   #FEF8F3;   /* card / tile background — LIGHTER than --paper */
  --paper-edge:   #EFDCCB;   /* hairline borders */

  /* metals & ink */
  --gold:         #AF8C3D;   /* primary accent, rules, small caps */
  --gold-light:   #C9A961;   /* gradients, shimmer highlight */
  --gold-pale:    #E4D5AC;   /* scratch-card surface */
  --gold-text:    #7E6226;   /* gold TEXT on --paper only — see below */
  --ink:          #3A342A;   /* body copy */
  --olive:        #796928;   /* secondary copy, taglines */

  /* event accents */
  --navy:         #1D234F;   /* Sangeet */
  --haldi:        #C8891A;   /* Haldi */
  --maroon:       #791D2A;   /* Wedding, envelope, seal */
}
```

### Two golds — which one goes where

`--paper` is a real peach (`#F7DAC6`), dark enough that `--gold` is no longer readable as
small text on it. There are therefore **two golds**, and the choice is decided by **the
surface the thing sits on**, not by what it is.

| | `--gold` `#AF8C3D` | `--gold-text` `#7E6226` |
|---|---|---|
| on `--paper` `#F7DAC6` | **2.38:1** — unreadable at small-caps sizes | **4.31:1** ✅ |
| on `--paper-deep` `#FEF8F3` | **3.00:1** — fine at the sizes used | 5.44:1 |

**`--gold-text` is for text sitting directly on `--paper`, and nothing else:**

- the letterspaced small-caps section labels (e.g. `AN INVITATION AWAITS` in S1)
- any gold copy outside a card (e.g. the `Anjali & Manish` sign-off in S8)

**`--gold` is unchanged and stays in use for:**

- the jaal pattern
- all rules and dividers, and the corner ornaments
- the S5 Directions button outline
- **any gold text sitting on a card** — the S6 `PALETTE` / `ATTIRE` labels and date chips,
  the S5 event small-caps, the S4 `CEREMONY n` label, the S2 `The Aurum, Ghaziabad` line

> Never do a blanket find-and-replace between these two. Ornament stays `--gold` even when
> it sits on `--paper` — the split is about **text legibility**, not about the colour.

Card separation: `--paper-deep` on `--paper` is **1.262**. Cards are LIGHTER than the page.

### Ornament assets — what "no image files" means

**Static `.svg` files in `public/` ARE allowed.** The rule is: **no raster images
(png / jpg / webp) for ornament**. Vector ornament shipped as `.svg` is the intended way.

The jaal patterns and the monogram are **supplied, finished assets**. Use them as-is.
Do not generate floral geometry procedurally, and do not "improve" them — the previous
attempt failed because the ornaments were built from circles. These use **pointed petals,
continuous stems and curling tendrils**, which is the whole difference.

| File | Tile | Stroke | Used by |
|---|---|---|---|
| `public/img/pattern/jaal-paper.svg` | 150×150 | `#AF8C3D` gold | page background (§3) |
| `public/img/pattern/jaal-envelope.svg` | 62×62 | `#F6E9CE` ivory | envelope body + flap (§S1) |
| `public/img/pattern/AS-monogram-path.txt` | viewBox `0 0 100 47.821` | — | seal monogram (§S1) |

The monogram is a bare SVG path string, rendered **inline** (so it can be filled from the
palette and costs no extra request), not as an `<img>`.

### Background

Two stacked layers, both fixed, both behind all content, both `pointer-events: none`.

1. **Paper grain** (bottom) — inline SVG `feTurbulence` at ~3% opacity.
2. **Gold jaal** (on top) — a plain div:
   `background-image: url(/img/pattern/jaal-paper.svg)`, `background-repeat: repeat`,
   `background-size: 150px 150px`, `opacity: 0.07`.

It should read as depth and texture, not as wallpaper. If the palette dots in S6 get harder
to read, the opacity is too high.

### Typography

Google Fonts, three families only:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Great+Vibes&family=Italianno&display=swap" rel="stylesheet">
```

| Role | Font | Treatment |
|---|---|---|
| Sign-off `Anjali & Manish` (S8) | **Italianno** | 2.3rem — ~20% up from the 1.9rem this would be in Great Vibes |
| Event names, section headings | **Great Vibes** | as-is |
| Couple names, dates, numerals | **Cormorant Garamond** 400/500 | italic for names |
| Taglines, attire lines, body | **Cormorant Garamond** 300/400 | — |
| Small-caps labels (`PALETTE`, `ATTIRE`, colour names, `DAYS`/`HOURS`) | **Cormorant Garamond** 500 | `text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem` |

Wide letter-spacing on small caps is the single strongest visual cue tying this to the
wardrobe cards. Use it consistently.

**Italianno is used in exactly one place** — the `Anjali & Manish` sign-off in S8.
Nowhere else. Great Vibes keeps every section heading and every event name.

The reason is legibility, not decoration: Great Vibes' capital `A` has no crossbar and is
drawn identically to its lowercase `a`, so `Anjali` reads as "anjali". Italianno's capital
`A` is unambiguous. **The markup is already correct — never "fix" these strings, change only
the font.** Italianno's strokes are much thinner, so it needs ~20% more size to hold the
same optical weight; normal text centring is fine there.

**The `AS` monogram is not type at all** — it is the supplied SVG path (§3, §S1). There is
no `.font-monogram` class; do not reintroduce one.

### Motion

- Library: `framer-motion`. Confetti: `canvas-confetti`.
- Every section fades up on scroll-in: `opacity 0→1`, `y 24→0`, `duration 0.7`, `ease [0.22,1,0.36,1]`, `viewport={{ once: true, amount: 0.3 }}`.
- Respect `prefers-reduced-motion`: disable all fade-ups, the countdown glow, and confetti.
  The scratch card and envelope stay functional.

---

## 4. Stack & structure

**Vite + React 18 + Tailwind CSS + framer-motion + canvas-confetti.** No Next.js, no router,
no state library, no UI kit. One scrolling page.

```
src/
  App.jsx
  data/events.js          // §2 verbatim
  components/
    Envelope.jsx          // S1
    SaveTheDate.jsx       // S2  (contains ScratchCard)
    ScratchCard.jsx
    Countdown.jsx         // S3
    Events.jsx            // S4
    Venues.jsx            // S5
    Wardrobe.jsx          // S6
    Gallery.jsx           // S7
    ThankYou.jsx          // S8
    MusicToggle.jsx       // persistent
    PaperTexture.jsx
public/
  img/gallery/gallery-1..4.webp
  img/venue/venue-{evara,caracalla,aurum}.webp
  img/og/og-image.jpg
  img/pattern/jaal-paper.svg          // 150x150 gold  — page background
  img/pattern/jaal-envelope.svg       // 62x62  ivory  — envelope body + flap
  img/pattern/AS-monogram-path.txt    // path data, inlined via data/monogram.js
  audio/theme.mp3         // owner drops this in — see §6
```

---

## 5. Section specs

### S1 — Envelope (full viewport, gate)

Page scroll is **locked** (`overflow: hidden` on body) until the envelope opens.

- Background `--paper`.
- Top: `AN INVITATION AWAITS` — small caps, `--gold`, letter-spaced 0.3em.
- Centre: a square envelope, roughly 78vw wide capped at 340px.

**Every value below is fixed. Record them, do not re-derive them.**

**Body**

| | |
|---|---|
| Fill | `#A82B4C` — crimson, **not** the old dark maroon |
| Jaal | `jaal-envelope.svg`, tiled at **62px**, opacity **0.30** |
| Inset rule 1 | 11px inset, 1px `#F3E4C8` at **34%** |
| Inset rule 2 | 15.5px inset, 0.6px `#F3E4C8` at **20%** |

**Flap**

- Covers the top **46%** of the height; its lower edge is a **quadratic curve dipping to 60%
  at centre**. For a quadratic from `(0,46)` to `(100,46)`, the midpoint sits at
  `0.25·y₀ + 0.5·y_ctrl + 0.25·y₁`, so the control point is **`Q 50 74`** — that is what
  puts the actual dip at 60%, not `Q 50 60`.
- Vertical gradient `#A82B4C → #8E2140`, plus the same jaal.
- Fold line: **1.4px black at 22%** along the curve.
- Highlight: **0.8px ivory at 16%** just below it.

**Wax seal** — ~**92px**, sitting on the flap's lower curve at centre.

- Irregular blob path (**NOT a circle**).
- Radial gradient `#EFE3C8 → #D9CBAB → #C3B491`, centre offset to **36% / 30%** so the light
  reads top-left.
- 1px `#B5A484` inner rule following the blob, inset ~7px.
- Soft blurred drop shadow beneath.
- Monogram: the `AS-monogram-path.txt` path, inline, `fill="#7A1A2E"`, width **~62% of the
  seal diameter**, centred by its own box.

> **Cream wax, dark monogram.** Do **not** put the seal in maroon with cream lettering —
> that inversion is exactly what stops it reading as wax.
- Below: `Tap the seal to open` in Great Vibes, `--maroon`.
- The seal has a slow breathing pulse (`scale 1 → 1.04 → 1`, 2.6s, infinite) to signal it's tappable.

### S1 is a FIXED OVERLAY, not a flow section

S1 renders at `position: fixed; inset: 0; z-index: 60`, above the page. S2–S8 lay out
normally with **S2 at the top of the document**. Scroll stays locked via `overflow: hidden`
on `html` **and** `body` while the overlay is up.

This is not cosmetic. As a flow section, S1 occupied a full viewport of document height, and
unmounting it shifted everything below up while a scroll animation was still running — the
browser clamped mid-animation and the page visibly jumped down, snapped up, then settled.
As an overlay the document height never changes, so nothing shifts.

> **There is no scroll-to-S2 anywhere.** The guest is already at the top of the document.
> Do not add one, and do not "fix" any future scroll issue by delaying a scroll call — layout
> shift was the problem, never timing. Locking `body` alone is also not enough: the base
> stylesheet sets `overflow-x: hidden` on body, which forces `overflow-y` to compute to `auto`.

**On tap** (the whole envelope is the hit target, not just the seal) — total ~3.3s, staged so
it reads as an envelope being opened rather than a page transition:

| At | What | Detail |
|---|---|---|
| 0.00s | seal presses in | `scale 1 → 0.94`, 0.15s — tactile response to the tap |
| 0.15s | seal lifts away | `scale 0.94 → 1.18`, `opacity 1 → 0`, 0.5s, ease-out |
| 0.65s | hold | 0.15s of stillness |
| 0.80s | flap opens | `rotateX 0 → -172deg`, 1.4s, `transform-origin: top`, parent `perspective: 1400px`, `cubic-bezier(0.34, 0.02, 0.15, 1)` |
| ~1.57s | interior appears | at ~55% of the flap's rotation, a soft inner shadow fades in at the top of the body so it reads as hollow (0.6s) |
| 2.20s | hold | 0.2s |
| 2.40s | envelope leaves | `scale 1 → 1.06`, `translateY 0 → -8px`, `opacity 1 → 0`, 0.9s ease-in-out |
| 2.60s | page cross-fades in | overlay `opacity 1 → 0`, 0.7s |
| 3.35s | overlay unmounts | scroll already unlocked at 2.40s |

Also on tap: audio starts (this tap is the user gesture that permits playback — see §6), and
`sessionStorage.setItem('envelopeOpened','1')`.

**The flap is two-sided.** The rotator carries `transform-style: preserve-3d`; each face is
clipped **individually** (`clip-path` on the rotator itself flattens the 3D context and kills
the underside). The underside is a lighter crimson **`#C25A72`** so the fold reads as paper
with two sides, not a flat plane disappearing. Its clip path is the flap shape mirrored about
the box's horizontal centre — the face is rotated `180deg`, which mirrors it back — otherwise
the underside appears at the BOTTOM of the envelope. A soft shadow travels down the envelope
face as the flap lifts off it.

On mount, if `sessionStorage.envelopeOpened === '1'`, skip S1 entirely and render from S2 with
scroll already unlocked. Guests reopening the link from WhatsApp should not re-do the gate.

**Fallback:** if nothing is tapped for **15 seconds**, run the same open sequence automatically.
WhatsApp WebView on older Android sometimes swallows the first touch event.

### S2 — Save the Date

- Heading `Save the Date` in Great Vibes, `--maroon`, ~3rem.
- Below it, the scratch card. Nothing else. **No date text above or around it.**

**ScratchCard component:**
- Container ~300×190px, rounded 12px, `--paper-deep`, thin `--gold` border, gold corner ornaments.
- Underneath (real DOM, always present, revealed by erasing the canvas above it):
  - `25th` — Cormorant Garamond italic, ~4rem, `--maroon`
  - `November 2026` — Cormorant Garamond, 1.2rem, `--olive`
  - a short gold rule with a centre dot
  - `The Aurum, Ghaziabad` — small caps, `--gold`
- Above it, a `<canvas>` filled with a gold gradient (`--gold-light` → `--gold` → `--gold-pale`,
  135°) plus a faint diagonal shimmer and the words `SCRATCH TO REVEAL` in small caps at ~35% opacity.

Implementation notes that matter:
- `ctx.globalCompositeOperation = 'destination-out'`, brush = `arc()` radius **25**, and interpolate
  between consecutive pointer positions or fast swipes leave gaps.
- Use **pointer events** (`pointerdown`/`pointermove`/`pointerup`), not separate mouse+touch handlers.
- `touch-action: none` on the canvas so scratching doesn't scroll the page.
- Size the canvas by `devicePixelRatio` or it renders blurry on phones.
- Guard against accidental reveal: auto-reveal requires **at least 3 `pointermove` events AND
  8% cleared** before the 28% threshold is even considered. Without it a single tap-and-hold
  can trip the threshold on a small card. Target feel: two or three diagonal swipes.
- The erase brush must be **fully opaque** (`fillStyle = 'rgba(0,0,0,1)'`) once
  `destination-out` is set. In that mode the *source alpha* is what gets removed, and the
  fillStyle still holds the shimmer gradient — whose alpha peaks at 0.34, so dabs would erase
  only a third and leave a gold ghost over the date that no amount of rubbing clears.
- Sample the alpha channel every ~12 moves (not every move — it's expensive). At **28% cleared**,
  animate the canvas opacity to 0 over 0.4s and fire confetti.
- Confetti: two bursts from `{y:0.6}`, `particleCount: 90`, spread 70, colours
  `['#AF8C3D','#C9A961','#791D2A','#F0E8D6','#1D234F']`.
- Persist `sessionStorage.dateRevealed` so it stays revealed on scroll-back.
- **Accessibility fallback:** after 10s of the card being in view and untouched, fade in a small
  `Reveal` text button beneath it. Some guests will be on desktop with a trackpad, and some
  older phones will not register the drag.

### S3 — Counting the Moments

- Heading `Counting the Moments`, Great Vibes, `--maroon`.
- Live countdown to `COUNTDOWN_TARGET`. Four units: **DAYS / HOURS / MINUTES / SECONDS**.
- Each unit is a tile: number in Cormorant Garamond ~2.6rem `--maroon`, label in small caps
  `--olive`. Tiles on `--paper-deep` with a hairline `--gold` border, 2×2 grid on mobile, 4×1 above 640px.
- **Glow on scroll-in** (the owner asked for this specifically): when the section enters the
  viewport, a soft gold radial glow blooms behind the tiles (`box-shadow: 0 0 40px -8px var(--gold)`,
  fading 0 → 0.9 → 0.35 over 1.8s), and a diagonal shimmer band sweeps left-to-right across the
  four tiles once. Subtle. It should read as light catching gold leaf, not as a neon effect.
- Recompute with `setInterval(..., 1000)`; clear on unmount.
- At zero: replace the tiles with `Today is the day` in Great Vibes and fire a sustained confetti
  burst (3 seconds, staggered).
- Never render negative values.

### S4 — Wedding Events

- Heading `Wedding Events`.
- Three catalogue cards, stacked on mobile, 3-up above 900px. Card = `--paper-deep`, rounded 16px,
  hairline `--gold` border, gold corner ornaments, soft shadow.
Modelled on `reference/inspiration/04-events-a.jpeg`.

**Card structure, top to bottom:**

1. **Art panel** — `aspect-[4/3]`, `object-cover`, full card width, rounded to match the
   card's top corners. Source is `event.art` → `/img/events/event-<id>.webp`.
2. **`CEREMONY 1 / 2 / 3`** — small caps `--gold`, right-aligned, overlaid on the **lower
   edge** of the art panel, on a pale scrim so it stays readable over any artwork.
3. **Event motif** — the line-art icon, small, in the event `accent`: dholak/musical notes
   for Sangeet, marigold for Haldi, kalash with mango leaves for Wedding.
4. **Event name** — Great Vibes, event `accent`, with a short gold rule beneath it.
5. **Four detail rows** — left-aligned, each a 14px inline-SVG line-art icon stroked in
   `--gold` at 70% opacity, plus text in Cormorant Garamond `--ink`:

   | Icon | Content |
   |---|---|
   | calendar | `dateLabel` |
   | clock | `time` |
   | pin | `venue`, then `address` in `--olive` |
   | garment | `attire` — in **italic `--olive`** |

- Motif does a slow float (`y: 0 → -6 → 0`, 4s, infinite) so the cards feel alive.

**Art files may not exist yet.** The panel must degrade gracefully: `onError` falls back to
the CSS watercolour wash — layered radial gradients in the event `accent` pushed through an
SVG `feTurbulence` + `feDisplacementMap` for a torn edge. Never show a broken image. When
the files are dropped in they appear with no code change.

**Do not use the venue photographs here.** Those belong to S5 and must not appear twice on
the same page.

> The tagline is deliberately **not** on these cards — it appears in §S6 only.

### S5 — The Venue

- Heading `The Venue`.
- Three tiles, same shell as S4. Each: venue photo (`aspect-[4/3]`, `object-cover`, rounded top),
  venue name (Great Vibes, `accent`), which event it hosts (small caps), address, and a
  **Directions** button.
- Button: outlined in `--gold`, small caps, with a small pin icon. `href={maps}`,
  `target="_blank"`, `rel="noopener noreferrer"`. Fills with `--gold` and white text on hover/press.
- Photos: `loading="lazy"`, `decoding="async"`, explicit `width`/`height` to prevent layout shift.

### S6 — Wedding Wardrobe

This section **replaces** the original wardrobe artwork. Layout target is
`reference/inspiration/06-wardrobe-LAYOUT-TARGET.jpeg`.

- Heading `Wedding Wardrobe` in Great Vibes, `--maroon`, with the sub-line
  `A little something to inspire your look for each celebration` in italic `--olive`.
- Three tiles, 1-up on mobile, 2-up above 768px. Tile = `--paper-deep`, rounded 14px, hairline
  `--gold` border, generous padding.
- Tile contents, top to bottom:
  1. Date chip, top-right corner: `24 NOV` / `25 NOV` — small caps, `--gold`, on a pale rounded pill.
  2. Small line-art SVG motif, top-left, in the event `accent` (same motifs as S4).
  3. Event name in **Great Vibes**, ~2.2rem, in the event `accent`.
  4. Tagline in Cormorant Garamond italic, `--olive`.
  5. `PALETTE` label, small caps `--gold`, with a short gold rule under it.
  6. **Palette dots row**: each colour is a `36px` circle, `background: hex`, with a 1px
     `rgba(0,0,0,0.12)` ring (essential — Warm Ivory is nearly invisible on the paper background
     without it). The colour name sits under each dot in small caps at `0.6rem`, `--olive`,
     wrapped to two lines where needed. Dots wrap onto a second row on narrow screens; do not
     shrink them below 30px.
  7. `ATTIRE` label, small caps `--gold`.
  8. The attire line in Cormorant Garamond, `--ink`.

**Wedding tile:** `palette` is `null`. Skip steps 5–6 entirely and render instead a gold
divider — a horizontal rule with a small centred diamond/dot, matching the original wedding
card — then `ATTIRE` and the attire line. Do not render an empty `PALETTE` heading.

Do **not** use the PNGs in `reference/wardrobe-originals/`. They are there so you can check
colours and wording against the source. Rendering them as images would put 3MB of unreadable
6px text on the page. Everything in this section is real HTML text and CSS circles.

### S7 — Our Gallery

- Heading `Our Gallery`.
- Horizontal snap-scroll strip: `overflow-x: auto`, `scroll-snap-type: x mandatory`,
  `-webkit-overflow-scrolling: touch`, hidden scrollbar.
- Four cards in **this exact order**: `gallery-1.webp`, `gallery-2.webp`, `gallery-3.webp`,
  `gallery-4.webp`. The numbering is the owner's chosen sequence — do not reorder or sort.
- Card: ~74vw wide (max 320px), `aspect-[3/4]`, `object-cover`, rounded 12px, thin `--gold` frame,
  `scroll-snap-align: center`. Note gallery-3 is landscape — `object-cover` handles it; do not
  special-case it.
- Peek the next card at the right edge so the horizontal affordance is obvious, and add a row of
  small gold dot indicators below that track scroll position.
- First image eager, rest `loading="lazy"`.
- Tapping a card opens a simple full-screen lightbox (dark backdrop, tap anywhere to close,
  swipe or arrow between images). Keep it in-component; no lightbox library.

### S8 — Thank You

Centred, generous vertical padding, then the site ends.

- Small gold ornament (a simple SVG flourish) above the text.
- Heading `With Love & Gratitude` in Great Vibes, `--maroon`.
- Body copy, Cormorant Garamond 300, `--ink`, `max-width: 34ch`, line-height 1.75, centred:

> There are days a family waits for, and this is ours.
>
> As Ankit and Srishti begin their journey together, we would be honoured to have you
> beside us — for the music, the colours, the laughter, and every small moment in between.
>
> Your blessings are the finest gift we could ask for.
>
> Hope to see you there.

- Gold rule with centre dot.
- Sign-off: `Anjali & Manish` — **Italianno**, ~2.3rem, `--gold`. This is the last
  thing on the page; nothing follows it.

### Persistent — Music toggle

- Fixed, bottom-right, `z-50`, ~44px circle, `--paper-deep` with `--gold` border and a small
  speaker / speaker-muted icon. Appears only after the envelope opens.
- Playing state: slow rotating ring or three animated bars, so it's visibly the music control.
- 44px minimum hit target — the guests using this are not all 25 years old.

---

## 6. Audio

The owner supplies the track. **Place his MP3 at `public/audio/theme.mp3`.** It is not
bundled with this spec — do not substitute a placeholder track or fetch one from anywhere.

### Encoding

Compress before committing (the raw file is ~3MB stereo, which is too heavy for 4G):

```bash
ffmpeg -y -i <source> -vn -ac 1 -b:a 72k -map_metadata -1 public/audio/theme.mp3
```

Mono at 72kbps is fine for background ambience on phone speakers and lands around 1.27MB.

**No limiter, no compressor, no gain reduction.** A previous encode ran the track through
`alimiter` to pull the peaks down; it ducked gain on loud passages and released between them,
which produced an audible **pumping** artifact mid-track. That is worse than the problem it
was solving. Do not reintroduce `alimiter`, `acompressor`, `adeclip`, `loudnorm`, or any
other dynamics filter — encode the source as-is.

**The shipped file, measured (`ffprobe` + `ffmpeg -af volumedetect`):**

| | |
|---|---|
| Codec / channels | MP3, **mono**, 44.1 kHz |
| Bitrate | 72k requested; **64 kbps** average as encoded |
| Duration | 2:42 (162.9s) |
| Size | **1.24 MB** (1,303,657 bytes) |
| Peak | **0.0 dBFS** |
| Mean | -14.0 dB |

The track loops with an audible seam at 2:42. **That is decided — leave it.**

**Playback rules:**

- `<audio preload="none" loop>`. `preload="none"` is essential — the file must not download
  on page load, only after the envelope tap. Otherwise it blocks first paint on slow connections.
- Autoplay with sound is blocked by every mobile browser. The **envelope tap in S1 is the user
  gesture that unlocks it** — call `audio.play()` inside that tap handler, synchronously, not
  after an `await`. This is the entire reason the envelope gate exists from a technical standpoint.
- Wrap `.play()` in `.catch(() => setMuted(true))`. If the browser refuses, the site must carry
  on silently with the toggle showing muted. Never let a rejected play promise throw.
- Fade in over ~1.5s to 0.35. Starting at full volume in a quiet room is how people close the tab.
- **Do not ramp with `setInterval`.** Stepping `HTMLMediaElement.volume` on a coarse timer makes
  every step an audible discontinuity — zipper noise, layered on top of whatever else is wrong.
  Use a **Web Audio `GainNode` with `linearRampToValueAtTime`**, which is sample-accurate, and
  keep a `requestAnimationFrame` volume ramp as the fallback for when Web Audio is unavailable.
  `createMediaElementSource` can only be called once per element, so build the graph once and
  guard it; when the graph is live the element runs at `volume = 1` and gain is the only control.
- Ramp down over ~180ms before `pause()` on mute. Cutting gain dead also clicks.
- Target volume 0.35, not 1.0.
- Mount the `<audio>` element **once, at App level**, and control it via ref. If it lives inside a
  component that re-renders on scroll, the track restarts and guests will hear it stutter.
- Persist mute state in `sessionStorage`.
- On iOS the hardware silent switch mutes HTML5 audio with no error and no way to detect it. This
  is expected. The visible toggle button is what tells those guests audio exists at all — which is
  why the toggle must be visible even when nothing is audible.

---

## 7. Performance budget

Total page weight **under 1.2MB** excluding audio. Current assets are 616KB, so the budget is
mostly about not adding to them.

- All photographs are already optimised WebP. Do not re-encode, do not add new raster images.
- Ornament is **vector only** — inline SVG, CSS, or a static `.svg` in `public/` (see §3).
  The jaal patterns and the monogram ship as `.svg` / path data; the event motifs, corner
  ornaments, and palette dots stay inline SVG and CSS. No raster ornament, ever.
- Fonts: `display=swap`, preconnect to `fonts.gstatic.com`.
- `canvas-confetti` is ~7KB; `framer-motion` is the heaviest dependency. Import named components
  (`import { motion } from 'framer-motion'`), never the whole namespace.
- Lazy-load every image below the fold. Set explicit `width`/`height` everywhere to kill CLS.
- Target: Lighthouse mobile Performance ≥ 90, first contentful paint under 2s on simulated 4G.

## 8. Testing checklist

Do not consider the build done until all of these pass:

- [ ] **Android Chrome and the WhatsApp in-app browser.** WhatsApp's WebView is not Chrome —
      test the envelope tap, the scratch drag, and audio playback there specifically. This is the
      single most likely place for something to silently fail.
- [ ] iOS Safari — envelope tap, scratch drag, audio (expect silence when the ringer switch is off).
- [ ] Scratch card works with a slow drag, a fast swipe, and a single tap-and-hold.
- [ ] Scratching does not scroll the page.
- [ ] Reload mid-page: envelope stays skipped, date stays revealed.
- [ ] 360px viewport (small Android) — nothing overflows horizontally.
- [ ] `prefers-reduced-motion: reduce` — no fade-ups, no glow, no confetti; content all reachable.
- [ ] WhatsApp link preview renders the OG card, and **the preview does not show the date**.
- [ ] Countdown shows correct values in IST and does not go negative.
- [ ] All three Directions buttons open the right venue in Google Maps.

## 9. Deploy

```bash
npm create vite@latest . -- --template react
npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
npm i framer-motion canvas-confetti
npm run dev          # then open http://<your-lan-ip>:5173 on your phone
```

Run `npm run dev -- --host` so the phone on the same Wi-Fi can reach it. **Test on a real phone
from day one** — this design lives or dies on a 390px screen, and the desktop preview will lie to you.

Then: push to GitHub → import into Vercel → framework preset **Vite**, build `npm run build`,
output `dist`. Free tier is comfortably sufficient at this guest count.

In `index.html`:

```html
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="Ankit & Srishti — An Invitation Awaits">
<meta property="og:description" content="Join us in Ghaziabad as we celebrate.">
<meta property="og:image" content="https://<your-app>.vercel.app/img/og/og-image.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F7DAC6">
<title>Ankit &amp; Srishti</title>
```

The `og:image` URL must be absolute, and the deployment must be public (no Vercel Deployment
Protection) or WhatsApp's crawler cannot fetch the preview.

---

## 10. Build order

Ship an ugly working version before a beautiful broken one.

1. Scaffold, tokens, fonts, paper texture, all eight sections stubbed with real copy and real images, no animation. **Deploy to Vercel on day one.**
2. S4, S5, S6, S7, S8 — real layouts, static.
3. S1 envelope + open sequence + scroll lock.
4. S2 scratch card + confetti.
5. S3 countdown + glow.
6. Audio + toggle.
7. Scroll animations, lightbox, reduced-motion.
8. Testing checklist, Lighthouse, family sign-off.

---

## 11. Reference files

`reference/` is context, not assets. Nothing in it ships.

| Path | What it is |
|---|---|
| `Wedding_Ecard_Design_Input.docx` | The owner's original brief. All copy, structure, and every source image. Read with `pandoc -t markdown` |
| `wardrobe_tiles.pdf` | The three wardrobe cards as originally designed — source of truth for palette names and attire wording |
| `inspiration/01-envelope.jpeg` | Envelope look: damask pattern, wax seal, "tap to open" |
| `inspiration/02-save-the-date-*.jpeg` | Save-the-date section styling |
| `inspiration/03-countdown-*.jpeg` | Countdown styling |
| `inspiration/04-events-*.jpeg` | Catalogue card styling for S4/S5 |
| `inspiration/06-wardrobe-LAYOUT-TARGET.jpeg` | **The layout to match for S6** |
| `inspiration/07-gallery-*.jpeg` | Horizontal gallery styling |
| `inspiration/08-thankyou.jpeg` | Closing section styling |
| `wardrobe-originals/*.png` | Original wardrobe artwork — colour/wording reference only, never rendered |

Inspiration images are screenshots of other studios' work. Match the *feel* — paper, gold,
generous whitespace, small caps, script headings. Do not trace their layouts or reuse their
ornaments.

---

## 12. Do not

- Do not add the date as text in S1 or S2, or to the OG image.
- Do not add an RSVP, a guest-name lookup, a "our story" section, a countdown scratch card, or a
  second gate of any kind.
- Do not add an `Add to Calendar` link, `.ics` generation, or any other download. This was
  specified once and removed deliberately — the S8 sign-off is the last thing on the page.
- Do not use Great Vibes for the `Anjali & Manish` sign-off — that is Italianno, for
  the crossbar reason in §3. The `AS` monogram is not type at all; it is the supplied SVG path.
- Do not regenerate the jaal patterns or the monogram procedurally, and do not rebuild floral
  ornament out of circles. The supplied `.svg` assets use pointed petals, continuous stems and
  curling tendrils — that is the whole difference. Use them as-is.
- Do not put the wax seal in maroon with cream lettering. Cream wax, dark monogram (§S1).
- Do not print surnames for Ankit or Srishti. Hosts are `Anjali & Manish`.
- Do not render `wardrobe-originals/*.png` on the page.
- Do not reorder the gallery photos or the events.
- Do not add localStorage — `sessionStorage` only, so a returning guest months later gets the full
  experience again.
- Do not add analytics, cookie banners, or any third-party script.
- Do not swap the stack to Next.js.
