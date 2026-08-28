/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Single source of truth for these values is the :root block in src/index.css.
      colors: {
        paper: {
          DEFAULT: 'var(--paper)',
          deep: 'var(--paper-deep)',
          edge: 'var(--paper-edge)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
          pale: 'var(--gold-pale)',
          text: 'var(--gold-text)',   // text on --paper only — see CLAUDE.md §3
        },
        ink: 'var(--ink)',
        olive: 'var(--olive)',
        navy: 'var(--navy)',
        haldi: 'var(--haldi)',
        maroon: 'var(--maroon)',
      },
      fontFamily: {
        script: ['"Great Vibes"', 'cursive'],
        signoff: ['"Italianno"', '"Great Vibes"', 'cursive'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
