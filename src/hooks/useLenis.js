import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./useMediaQuery.js";

/* Site-wide smooth inertia scroll, synced to GSAP ScrollTrigger.
   Returns nothing; exposes the instance on window.__lenis for anchor links. */
export function useLenis() {
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, [reduce]);
}

/* Smoothly scroll to a hash target via Lenis when available. */
export function scrollToHash(hash) {
  const el = document.querySelector(hash);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -10, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}
