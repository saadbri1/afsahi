/* "Step in. Exhale." — full-bleed pinned cinematic moment.
   GSAP pattern: parallax-scrub on the image, opacity scrub on the text. */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

export default function ExperienceSection() {
  const { t } = useLang();
  const e = t.experience;
  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const textRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // parallax scrub on image
      gsap.fromTo(imgRef.current,
        { yPercent: -8 },
        { yPercent: 8, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } }
      );
      // text fade-in on scroll entry
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%", toggleActions: "play none none reverse" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <img ref={imgRef} src={IMAGES.interior}
        alt="Luxury vehicle interior — immaculate cream leather, ambient lighting"
        className="absolute inset-0 h-[120%] w-full -translate-y-[10%] object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,13,9,0.85)_0%,rgba(16,13,9,0.5)_50%,rgba(16,13,9,0.2)_100%)]" />
      <div ref={textRef} className="absolute inset-0 flex items-center opacity-0">
        <div className="wrap">
          <h2 className="max-w-[10ch] text-[clamp(3rem,7vw,5.5rem)] leading-[1.04] text-white">{e.title}</h2>
          <p className="mt-5 max-w-[36ch] text-[1.1rem] text-white/75">{e.sub}</p>
        </div>
      </div>
    </section>
  );
}
