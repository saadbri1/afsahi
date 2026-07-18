import { useLayoutEffect, useRef } from "react";
import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { gsap, MOTION, ScrollTrigger } from "../lib/motion.js";
import BookingWidget from "./BookingWidget.jsx";

export default function Hero({ onSeePrices }) {
  const { t } = useLang();
  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const words = t.hero.title.trim().split(/\s+/);
  const titleLines = [words[0], words.slice(1).join(" ")].filter(Boolean);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const image = imageRef.current;
    if (!root || !image) return undefined;

    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 900px) and (hover: hover) and (pointer: fine)",
        mobile: "(max-width: 899px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, reduceMotion } = context.conditions;
        const lines = gsap.utils.toArray("[data-hero-line]");
        const supporting = gsap.utils.toArray("[data-hero-support]");

        if (reduceMotion) {
          gsap.set(["[data-hero-media]", lines, supporting], { clearProps: "all", autoAlpha: 1 });
          return undefined;
        }

        const timeline = gsap.timeline({
          defaults: { ease: MOTION.ease.premiumOut },
        });
        timeline
          .fromTo("[data-hero-media]",
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: desktop ? 1.15 : 0.78 }, 0)
          .fromTo(image,
            { scale: desktop ? 1.065 : 1.035 },
            { scale: MOTION.scale.resting, duration: desktop ? 1.45 : 0.9 }, 0)
          .fromTo("[data-hero-kicker]", { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.55 }, 0.18)
          .fromTo(lines, { yPercent: 115 },
            { yPercent: 0, duration: desktop ? 0.96 : 0.68, stagger: 0.08 }, 0.24)
          .fromTo(supporting, { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.08 }, 0.52);

        if (desktop) {
          gsap.to(image, {
            yPercent: 5,
            scale: 1.035,
            ease: MOTION.ease.linear,
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: 0.45,
              id: "hero-parallax",
            },
          });

          const xTo = gsap.quickTo("[data-hero-depth]", "xPercent", { duration: 0.8, ease: MOTION.ease.premiumOut });
          const yTo = gsap.quickTo("[data-hero-depth]", "yPercent", { duration: 0.8, ease: MOTION.ease.premiumOut });
          const onPointerMove = (event) => {
            const bounds = root.getBoundingClientRect();
            xTo(((event.clientX - bounds.left) / bounds.width - 0.5) * 1.8);
            yTo(((event.clientY - bounds.top) / bounds.height - 0.5) * 1.2);
          };
          const onPointerLeave = () => { xTo(0); yTo(0); };
          root.addEventListener("pointermove", onPointerMove, { passive: true });
          root.addEventListener("pointerleave", onPointerLeave);
          return () => {
            root.removeEventListener("pointermove", onPointerMove);
            root.removeEventListener("pointerleave", onPointerLeave);
          };
        }
        return undefined;
      },
      root
    );

    let active = true;
    image.decode?.().catch(() => {}).finally(() => active && ScrollTrigger.refresh());
    return () => { active = false; media.revert(); };
  }, [t.hero.title]);

  return (
    <section ref={rootRef} id="hero" className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-noir">
      <span data-nav-sentinel className="pointer-events-none absolute left-0 top-6 h-px w-px" aria-hidden="true" />

      <div data-hero-media className="absolute inset-0 z-0 overflow-hidden">
        <picture>
          <source
            type="image/webp"
            srcSet="/images/optimized/hero-720.webp 720w, /images/optimized/hero-1280.webp 1280w, /images/optimized/hero-1920.webp 1920w"
            sizes="100vw"
          />
          <img ref={imageRef} data-hero-depth src={IMAGES.hero}
            alt="Afsahi chauffeur opening a luxury car door for a client"
            width="2400" height="1602" loading="eager" fetchPriority="high" decoding="async"
            className="h-full w-full object-cover object-[33%_45%] sm:object-[42%_46%] lg:object-[center_46%]" />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(14,11,7,0.79)_0%,rgba(14,11,7,0.54)_35%,rgba(14,11,7,0.22)_66%,rgba(14,11,7,0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(to_top,rgba(14,11,7,0.88)_0%,transparent_100%)]" />
        <div className="hero-light absolute -right-[12%] top-[8%] h-[62%] w-[52%] rounded-full bg-[radial-gradient(circle,rgba(225,195,135,0.18),transparent_68%)]" aria-hidden="true" />
      </div>

      <div className="wrap relative z-[2] flex flex-1 flex-col items-center justify-center pb-8 pt-28 text-center text-white sm:pb-14">
        <span data-hero-kicker className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-champ-lt sm:text-[0.72rem]">
          {t.hero.kicker}
        </span>
        <h1 className="mt-5 max-w-[13ch] text-[clamp(3.4rem,8.4vw,7rem)] text-white">
          {titleLines.map((line) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block will-change-transform">{line}</span>
            </span>
          ))}
        </h1>
        <p data-hero-support className="mt-4 max-w-[39ch] text-[clamp(0.98rem,1.6vw,1.12rem)] leading-relaxed text-white/78">
          {t.hero.sub}
        </p>
        <div data-hero-support className="mt-8 flex items-center gap-3 text-[0.61rem] font-semibold uppercase tracking-[0.2em] text-white/58" aria-hidden="true">
          <span className="h-px w-10 bg-champ/80" /> Casablanca · Marrakech · Nationwide
        </div>
      </div>

      <div data-hero-support className="wrap relative z-[3] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-9">
        <div className="mx-auto max-w-[1040px]">
          <BookingWidget onSeePrices={onSeePrices} />
        </div>
      </div>

      <a href="#services" data-hero-support aria-label="Explore services"
        className="absolute bottom-8 right-[clamp(1.3rem,5vw,2.5rem)] z-[4] hidden items-center gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-white/65 lg:flex">
        Scroll <span className="hero-scroll-line relative h-12 w-px overflow-hidden bg-white/25" />
      </a>
    </section>
  );
}
