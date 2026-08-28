import { useEffect, useRef, useState } from 'react';
import {
  EASE,
  DURATION_MS,
  OPACITY_DURATION_MS,
  Y_OFFSET,
  VIEWPORT_AMOUNT,
  VIEWPORT_MARGIN,
  STAGGER_MS,
  prefersReducedMotion,
} from '../lib/motion.js';

/**
 * Fade-up on scroll-in (§3): opacity 0->1, y 24->0, 700ms,
 * cubic-bezier(0.22, 1, 0.36, 1), fired once at 30% visibility.
 *
 * Reduced motion is handled in JS, not only in CSS: `shown` starts true, so the
 * element is never given the hidden state in the first place. Killing the
 * transition in CSS alone would still leave content at opacity 0 if the
 * observer never fired — content must always be reachable.
 */
export function useReveal(threshold = VIEWPORT_AMOUNT, rootMargin = VIEWPORT_MARGIN) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (shown) return;
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or a zero-height viewport) must never mean
    // permanently invisible content — show it and move on.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect(); // once: true
        }
      },
      // A positive bottom margin grows the root downward, so elements start
      // animating while still below the fold and have arrived by the time the
      // guest reads them.
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [shown, threshold, rootMargin]);

  return [ref, shown];
}

/**
 * Wrapper that applies the fade-up.
 *
 * `index` staggers siblings by STAGGER_MS so a row of cards arrives in
 * sequence rather than as a block.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  index = 0,
  delay = 0,
  threshold = VIEWPORT_AMOUNT,
  rootMargin = VIEWPORT_MARGIN,
  className,
  style,
  ...rest
}) {
  const [ref, shown] = useReveal(threshold, rootMargin);
  const reduced = prefersReducedMotion();
  const totalDelay = reduced ? 0 : delay + index * STAGGER_MS;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        // `none` rather than translateY(0): a lingering transform would make
        // this a containing block for position:fixed descendants.
        transform: shown ? 'none' : `translateY(${Y_OFFSET}px)`,
        // Opacity runs slightly longer than the transform, so the element has
        // settled in place a beat before it finishes becoming fully solid.
        transition: reduced
          ? 'none'
          : `opacity ${OPACITY_DURATION_MS}ms ${EASE} ${totalDelay}ms, transform ${DURATION_MS}ms ${EASE} ${totalDelay}ms`,
        willChange: shown ? 'auto' : 'opacity, transform',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
