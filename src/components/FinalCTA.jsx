/* "Ready when you are." — dark cinematic CTA band */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { buildWhatsAppUrl, SIMPLE_WHATSAPP_MESSAGE } from "../lib/whatsapp.js";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

export default function FinalCTA({ onSeePrices }) {
  const { t } = useLang();
  const c = t.cta;
  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const textRef = useRef(null);
  const reduce = usePrefersReducedMotion();
  const waHref = buildWhatsAppUrl(SIMPLE_WHATSAPP_MESSAGE);

  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(imgRef.current,
        { yPercent: -6 },
        { yPercent: 6, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } }
      );
      gsap.fromTo(textRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 68%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} id="contact" className="section bg-noir">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-3xl">
          <img ref={imgRef} src={IMAGES.sectionCta} alt="Black Mercedes-Benz S-Class with the rear door open in front of a modern hotel"
            width="1600" height="1068" loading="lazy" decoding="async"
            className="absolute inset-0 h-[120%] w-full -translate-y-[10%] object-cover object-[58%_55%] opacity-65" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(16,13,9,0.96)_30%,rgba(16,13,9,0.65)_70%,rgba(16,13,9,0.45))]" />
          <div ref={textRef} className="relative px-[clamp(2rem,6vw,5rem)] py-[clamp(3.5rem,7vw,6rem)] opacity-0">
            <p className="eyebrow mb-5 text-champ-lt">Afsahi Luxury Transport</p>
            <h2 className="max-w-[14ch] text-[clamp(2.4rem,5vw,4.2rem)] text-cream">{c.title}</h2>
            <p className="mt-5 max-w-[38ch] text-[1.05rem] leading-relaxed text-cream/70">{c.sub}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <button onClick={onSeePrices}
                className="inline-flex items-center gap-2 rounded-full bg-champ px-8 py-4 text-[0.84rem] font-semibold tracking-wide text-white shadow-[0_4px_24px_rgba(169,130,63,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-champ-lt">
                {c.primary}
              </button>
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/5 px-8 py-4 text-[0.84rem] font-semibold text-cream backdrop-blur transition-all duration-300 hover:border-cream/50 hover:bg-cream/10">
                <WaIcon /> {c.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
