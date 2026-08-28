/**
 * Persistent music toggle, fixed bottom-right.
 *
 * BUILD STEP 1: shell only, inert. The audio element, the envelope-tap unlock,
 * the 1.5s volume ramp to 0.35, sessionStorage mute state and the playing-state
 * animation land in build step 6 (§10). It is rendered now so its position and
 * 44px hit target can be checked on a real phone; in the finished build it
 * appears only after the envelope opens.
 */
export default function MusicToggle() {
  return (
    <button
      type="button"
      aria-label="Play music"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full"
      style={{
        width: 44,
        height: 44,
        backgroundColor: 'var(--paper-deep)',
        border: '1px solid var(--gold)',
        color: 'var(--gold)',
        boxShadow: '0 4px 14px -6px rgba(58,52,42,0.5)',
      }}
    >
      <SpeakerMutedIcon />
    </button>
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
