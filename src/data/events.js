// Canonical event data — copied verbatim from CLAUDE.md §2. Do not edit values here.
// Order is always Sangeet -> Haldi -> Wedding. Sangeet is the evening before;
// Haldi is the morning of the wedding day. That is correct.

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

// Intrinsic pixel dimensions of the shipped WebP files. Rendered as explicit
// width/height attributes so images reserve their box before decode (kills CLS).
export const IMAGE_SIZES = {
  '/img/venue/venue-evara.webp':     { w: 900, h: 600 },
  '/img/venue/venue-caracalla.webp': { w: 770, h: 513 },
  '/img/venue/venue-aurum.webp':     { w: 900, h: 600 },
  '/img/gallery/gallery-1.webp':     { w: 506, h: 900 },
  '/img/gallery/gallery-2.webp':     { w: 676, h: 900 },
  '/img/gallery/gallery-3.webp':     { w: 900, h: 599 },
  '/img/gallery/gallery-4.webp':     { w: 675, h: 900 },
};

// Owner's chosen sequence. Do not reorder or sort.
export const GALLERY = [
  '/img/gallery/gallery-1.webp',
  '/img/gallery/gallery-2.webp',
  '/img/gallery/gallery-3.webp',
  '/img/gallery/gallery-4.webp',
];
