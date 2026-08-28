/**
 * Persistent music toggle, fixed bottom-right (§6).
 *
 * Appears only after the envelope opens. The element itself lives at App level
 * and is controlled by ref — this is only the control surface.
 *
 * On iOS the hardware silent switch mutes HTML5 audio with no error and no way
 * to detect it. That is expected, and it is exactly why this button stays
 * visible even when nothing is audible: it is what tells those guests audio
 * exists at all.
 */
export default function MusicToggle({ muted, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Play music' : 'Mute music'}
      aria-pressed={!muted}
      className="tappable fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full"
      style={{
        width: 44, // 44px minimum — these guests are not all 25 years old
        height: 44,
        backgroundColor: 'var(--paper-deep)',
        border: '1px solid var(--gold)',
        color: 'var(--gold)',
        boxShadow: '0 4px 14px -6px rgba(58,52,42,0.5)',
      }}
    >
      <style>{`
        @keyframes music-bar {
          0%, 100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1); }
        }
        .music-bar { transform-origin: center bottom; animation: music-bar 900ms ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .music-bar { animation: none; transform: scaleY(0.7); } }
      `}</style>

      {muted ? <SpeakerMutedIcon /> : <PlayingBars />}
    </button>
  );
}

/** Three animated bars, so it reads unmistakably as the music control. */
function PlayingBars() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {[
        { x: 3.5, delay: '0ms' },
        { x: 8, delay: '150ms' },
        { x: 12.5, delay: '300ms' },
      ].map((b) => (
        <rect
          key={b.x}
          className="music-bar"
          x={b.x}
          y="4"
          width="2"
          height="10"
          rx="1"
          fill="currentColor"
          style={{ animationDelay: b.delay }}
        />
      ))}
    </svg>
  );
}

function SpeakerMutedIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 7.5h3L11 4v12L7 12.5H4z" />
      <path d="M14 8l4 4M18 8l-4 4" />
    </svg>
  );
}
