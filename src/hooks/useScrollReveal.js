import { useEffect, useRef } from "react";
import { gsap, MOTION } from "../lib/motion.js";
import { usePrefersReducedMotion } from "./useMediaQuery.js";

/* Fade-up reveal for an element (and optional staggered children).
   Usage: const ref = useScrollReveal(); <div ref={ref}> ... */
export function useScrollReveal({ y = 18, stagger = MOTION.stagger.base, delay = 0, childSelector = "[data-reveal-child]" } = {}) {
  const ref = useRef(null);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) return;
    const children = el.querySelectorAll(childSelector);
    const targets = children.length ? children : [el];
    gsap.set(targets, { autoAlpha: 0, y });
    const tween = gsap.to(targets, {
      autoAlpha: 1,
      y: 0,
      delay,
      duration: MOTION.duration.slow,
      ease: MOTION.ease.premiumOut,
      stagger: children.length ? stagger : 0,
      scrollTrigger: { trigger: el, start: "clamp(top 88%)", once: true },
    });
    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [reduce, y, stagger, delay, childSelector]);
  return ref;
}
