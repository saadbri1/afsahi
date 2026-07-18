import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

const premiumOut = CustomEase.create("afsahiPremiumOut", "0.16,1,0.3,1");
const refinedOut = CustomEase.create("afsahiRefinedOut", "0.22,1,0.36,1");

export const MOTION = Object.freeze({
  duration: Object.freeze({ instant: 0.18, fast: 0.32, base: 0.62, slow: 0.92, cinematic: 1.25 }),
  ease: Object.freeze({ premiumOut, refinedOut, linear: "none" }),
  delay: Object.freeze({ short: 0.08, base: 0.16, long: 0.28 }),
  stagger: Object.freeze({ tight: 0.06, base: 0.1, editorial: 0.14 }),
  distance: Object.freeze({ small: 12, base: 24, large: 48 }),
  opacity: Object.freeze({ hidden: 0, muted: 0.42, visible: 1 }),
  scale: Object.freeze({ imageStart: 1.035, resting: 1, press: 0.98 }),
});

export const motionConditions = Object.freeze({
  desktop: "(min-width: 900px) and (hover: hover) and (pointer: fine)",
  mobile: "(max-width: 899px)",
  reduced: "(prefers-reduced-motion: reduce)",
});

export { gsap, ScrollTrigger };
