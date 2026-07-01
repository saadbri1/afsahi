import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";
import BookingWidget from "./BookingWidget.jsx";

export default function Hero({ onSeePrices }) {
  const { t } = useLang();
  const imgRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce || !imgRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        scale: 1.1, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      });
    });
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* photo */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img ref={imgRef} src={IMAGES.hero} alt="Afsahi chauffeur opening the door of a luxury Mercedes for a client"
          className="h-full w-full scale-[1.04] object-cover object-[33%_45%] sm:object-[42%_46%] lg:object-[center_46%]" />
        {/* left-to-right gradient: deep on left for text, opens toward the scene on right */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,11,7,0.78)_0%,rgba(14,11,7,0.52)_35%,rgba(14,11,7,0.24)_62%,rgba(14,11,7,0.08)_100%)]" />
        {/* bottom vignette so booking bar stays readable */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(14,11,7,0.80)_0%,transparent_100%)]" />
      </div>

      {/* centered copy */}
      <div className="wrap relative z-[2] flex flex-1 flex-col items-center justify-center pt-28 text-center text-white">
        <span className="hero-rise text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-champ-lt" style={{ animationDelay: "0.1s" }}>
          {t.hero.kicker}
        </span>
        <h1 className="hero-rise mt-5 max-w-[16ch] text-[clamp(3rem,7vw,6rem)] text-white" style={{ animationDelay: "0.25s" }}>
          {t.hero.title}
        </h1>
        <p className="hero-rise mt-5 max-w-[40ch] text-[1.1rem] text-white/80" style={{ animationDelay: "0.4s" }}>
          {t.hero.sub}
        </p>
      </div>

      {/* booking bar */}
      <div className="wrap relative z-[2] hero-rise pb-10" style={{ animationDelay: "0.55s" }}>
        <div className="mx-auto max-w-[960px]">
          <BookingWidget onSeePrices={onSeePrices} />
        </div>
      </div>
    </section>
  );
}
