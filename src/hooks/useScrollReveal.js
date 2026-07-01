import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./useMediaQuery.js";

/* Fade-up reveal for an element (and optional staggered children).
   Usage: const ref = useScrollReveal(); <div ref={ref}> ... */
export function useScrollReveal({ y = 34, stagger = 0.12, childSelector = "[data-reveal-child]" } = {}) {
  const ref = useRef(null);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const children = el.querySelectorAll(childSelector);
    const targets = children.length ? children : [el];
    gsap.set(targets, { opacity: 0, y });
    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      stagger: children.length ? stagger : 0,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
  }, [reduce, y, stagger, childSelector]);
  return ref;
}
