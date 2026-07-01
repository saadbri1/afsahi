/* "Made for the way you work." — split feature section */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle } from "lucide-react";
import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

export default function BusinessSection() {
  const { t } = useLang();
  const b = t.business;
  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const textRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(imgRef.current,
        { yPercent: -6 },
        { yPercent: 6, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } }
      );
      gsap.fromTo("[data-biz-child]",
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, stagger: 0.1, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: textRef.current, start: "top 72%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className="section bg-sand">
      <div className="wrap">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <img ref={imgRef} src={IMAGES.fleetFirst}
              alt="Professional chauffeur opening door of a Mercedes S-Class"
              className="absolute inset-0 h-[115%] w-full -translate-y-[7%] object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,13,9,0.22)_0%,transparent_50%)]" />
          </div>
          <div ref={textRef} className="flex flex-col gap-6">
            <span data-biz-child className="eyebrow">{b.kicker}</span>
            <h2 data-biz-child className="text-[clamp(2.2rem,4vw,3.6rem)]">{b.title}</h2>
            <p data-biz-child className="max-w-[38ch] text-[1.05rem] leading-relaxed text-body">{b.sub}</p>
            <ul data-biz-child className="flex flex-col gap-3 pt-2">
              {b.bullets.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[0.95rem] text-body">
                  <CheckCircle size={17} className="shrink-0 text-champ" strokeWidth={1.8} />
                  {item}
                </li>
              ))}
            </ul>
            <div data-biz-child className="pt-3">
              <a href="#book"
                className="inline-flex items-center gap-2 rounded-full border border-ink px-7 py-3.5 text-[0.82rem] font-semibold tracking-wide text-ink transition-all duration-300 hover:border-champ hover:text-champ-dk">
                {b.cta}
                <span className="text-champ">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
