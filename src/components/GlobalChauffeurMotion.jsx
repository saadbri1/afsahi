import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLang } from "../context/LanguageContext.jsx";
import { gsap, MOTION } from "../lib/motion.js";

const DESKTOP_QUERY = "(min-width: 1100px) and (prefers-reduced-motion: no-preference)";
const VIDEO_FALLBACK_DURATION = 9.85;

const STORIES = [
  {
    id: "airport",
    image: "/images/optimized/services/airport-transfers.webp",
    width: 900,
    height: 1348,
    position: "center 58%",
    cities: "Casablanca · Marrakech · Rabat",
  },
  {
    id: "intercity",
    image: "/images/optimized/sections/cta-ready.webp",
    width: 1600,
    height: 1068,
    position: "center 54%",
    cities: "Tangier · Fez · Casablanca · Agadir",
  },
  {
    id: "executive",
    image: "/images/optimized/hero-1280.webp",
    srcSet: "/images/optimized/hero-720.webp 720w, /images/optimized/hero-1280.webp 1280w",
    width: 1280,
    height: 854,
    position: "center 48%",
    cities: "Casablanca · Rabat · Marrakech",
  },
];

const COPY = {
  en: {
    kicker: "Nationwide service",
    title: ["One standard,", "across Morocco."],
    body: "Airport to boardroom, city to city — one trusted chauffeur team, one uncompromising level of care.",
    cta: "Plan your journey",
    progress: "Journey chapters",
    network: "Morocco / Nationwide network",
    signal: "Live service geography",
    stages: [
      {
        label: "Airport arrival",
        title: ["Seamless airport", "arrivals"],
        body: "Professional pickup, flight-aware coordination and direct transfer.",
        alt: "A private passenger arriving in a chauffeur-driven car",
      },
      {
        label: "Intercity",
        title: ["Intercity journeys,", "coordinated end to end"],
        body: "Reliable long-distance travel with one trusted team.",
        alt: "AFSAHI chauffeur service connecting major Moroccan cities",
      },
      {
        label: "Executive day",
        title: ["Executive mobility,", "all day"],
        body: "Flexible chauffeur service for meetings, events and private schedules.",
        alt: "An executive chauffeur welcoming a private passenger",
      },
    ],
  },
  fr: {
    kicker: "Service national",
    title: ["Une exigence,", "partout au Maroc."],
    body: "De l’aéroport à la salle de réunion, d’une ville à l’autre — une seule équipe, une même exigence de service.",
    cta: "Planifier votre trajet",
    progress: "Chapitres du voyage",
    network: "Maroc / Réseau national",
    signal: "Géographie de service",
    stages: [
      {
        label: "Arrivée aéroport",
        title: ["Des arrivées aéroport", "sans friction"],
        body: "Accueil professionnel, coordination selon le vol et transfert direct.",
        alt: "Une passagère accueillie par un service de chauffeur privé",
      },
      {
        label: "Interurbain",
        title: ["Des trajets interurbains", "coordonnés de bout en bout"],
        body: "Voyage longue distance fiable, assuré par une seule équipe de confiance.",
        alt: "Le service de chauffeur AFSAHI reliant les grandes villes du Maroc",
      },
      {
        label: "Journée exécutive",
        title: ["Une mobilité exécutive,", "toute la journée"],
        body: "Un chauffeur flexible pour vos réunions, événements et programmes privés.",
        alt: "Un chauffeur exécutif accueillant une passagère privée",
      },
    ],
  },
};

const CITIES = [
  { name: "Tangier", x: 420, y: 72, align: "end" },
  { name: "Rabat", x: 472, y: 216, align: "start" },
  { name: "Casablanca", x: 378, y: 292, align: "end" },
  { name: "Fez", x: 664, y: 196, align: "start" },
  { name: "Marrakech", x: 486, y: 452, align: "start" },
  { name: "Agadir", x: 326, y: 578, align: "end" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== "undefined" && window.matchMedia(query).matches
  ));

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function RouteNetwork({ compact = false }) {
  return (
    <svg
      viewBox="0 0 1000 680"
      className="h-full w-full overflow-visible"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio={compact ? "xMidYMid meet" : "xMidYMid slice"}
    >
      <g opacity={compact ? 0.34 : 0.2}>
        <path d="M420 72C434 126 452 176 472 216C445 244 412 270 378 292C406 350 449 404 486 452C434 504 378 548 326 578" stroke="#F6F2EA" strokeWidth="1" />
        <path d="M472 216C532 181 598 174 664 196" stroke="#F6F2EA" strokeWidth="1" />
        <path d="M378 292C465 310 548 352 588 422" stroke="#F6F2EA" strokeWidth="1" strokeDasharray="3 8" />
        <path d="M486 452C574 484 624 532 680 612" stroke="#F6F2EA" strokeWidth="1" strokeDasharray="3 8" />
      </g>

      <path
        data-route-line="0"
        d="M378 292C405 264 442 238 472 216M378 292C414 348 456 407 486 452"
        stroke="#E3C47E"
        strokeWidth={compact ? 2.2 : 1.7}
        strokeLinecap="round"
      />
      <path
        data-route-line="1"
        d="M420 72C434 126 452 176 472 216C445 244 412 270 378 292C406 350 449 404 486 452C434 504 378 548 326 578M472 216C532 181 598 174 664 196"
        stroke="#E3C47E"
        strokeWidth={compact ? 2.2 : 1.7}
        strokeLinecap="round"
      />
      <path
        data-route-line="2"
        d="M378 292C438 262 516 264 552 309C589 355 554 422 486 452C422 421 370 365 378 292"
        stroke="#E3C47E"
        strokeWidth={compact ? 2.2 : 1.7}
        strokeLinecap="round"
      />

      {CITIES.map((city) => (
        <g key={city.name} data-city-node={city.name} transform={`translate(${city.x} ${city.y})`}>
          <circle r={compact ? 12 : 17} fill="rgba(227,196,126,.08)" />
          <circle r="3.5" fill="#E3C47E" />
          <text
            x={city.align === "end" ? -18 : 18}
            y="4"
            textAnchor={city.align}
            fill="rgba(246,242,234,.78)"
            fontSize={compact ? 16 : 13}
            letterSpacing="2.2"
          >
            {city.name.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}

function JourneyButton({ children, onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex min-h-12 items-center overflow-hidden text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#E3C47E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#E3C47E] active:translate-y-px ${compact ? "mt-7" : "mt-8"}`}
    >
      <span className="relative pb-2">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-100 bg-[#E3C47E]/70 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:origin-left group-hover:scale-x-0" />
      </span>
      <span className="ml-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E3C47E]/35 transition-[transform,border-color,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 group-hover:border-[#F6F2EA]/70 group-hover:text-[#F6F2EA]" aria-hidden="true">↗</span>
    </button>
  );
}

function StoryImage({ story, alt }) {
  return (
    <img
      src={story.image}
      srcSet={story.srcSet}
      sizes="(min-width: 768px) 54vw, 100vw"
      width={story.width}
      height={story.height}
      loading="lazy"
      decoding="async"
      alt={alt}
      className="h-full w-full object-cover"
      style={{ objectPosition: story.position }}
    />
  );
}

function StackedStories({ content, onSeePrices, reduced = false }) {
  return (
    <div data-cinematic-fallback className="wrap py-24 sm:py-28 md:py-32">
      <header className="max-w-[53rem] md:grid md:grid-cols-[1fr_0.72fr] md:items-end md:gap-14">
        <div>
          <span className="eyebrow eyebrow--ondark">{content.kicker}</span>
          <h2 className="mt-6 max-w-[10ch] text-[clamp(3rem,11vw,6rem)] leading-[0.9] tracking-[-0.04em] text-cream">
            {content.title.map((line) => <span key={line} className="block">{line}</span>)}
          </h2>
        </div>
        <div className="mt-8 md:mt-0 md:pb-1">
          <p className="max-w-[34rem] text-[0.96rem] leading-7 text-cream/62">{content.body}</p>
          <JourneyButton onClick={onSeePrices} compact>{content.cta}</JourneyButton>
        </div>
      </header>

      <div className="mt-24 space-y-28 sm:mt-28 sm:space-y-32 md:mt-36 md:space-y-40">
        {STORIES.map((story, index) => {
          const stage = content.stages[index];
          const reverse = index % 2 === 1;
          return (
            <article key={story.id} data-fallback-story className="md:grid md:grid-cols-12 md:items-end md:gap-8">
              <div className={`relative aspect-[4/5] overflow-hidden bg-[#0A0907] sm:aspect-[16/11] md:col-span-7 md:aspect-[4/3] ${reverse ? "md:col-start-6 md:row-start-1" : "md:col-start-1"}`}>
                <StoryImage story={story} alt={stage.alt} />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,5,.02),rgba(8,7,5,.12)_55%,rgba(8,7,5,.7))]" />
                {index === 1 && (
                  <div className="pointer-events-none absolute inset-y-[8%] right-[-10%] w-[82%] opacity-90">
                    <RouteNetwork compact />
                  </div>
                )}
                <p className="absolute bottom-5 left-5 right-5 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-cream/65 sm:bottom-7 sm:left-7">
                  {story.cities}
                </p>
              </div>

              <div className={`relative mt-8 md:col-span-5 md:mt-0 md:pb-8 ${reverse ? "md:col-start-1 md:row-start-1" : "md:col-start-8 md:pl-6"}`}>
                <div className="mb-7 flex items-center gap-4 text-[0.59rem] font-semibold uppercase tracking-[0.2em] text-cream/48">
                  <span className="text-[#E3C47E]">0{index + 1}</span>
                  <span className="h-px w-10 bg-[#E3C47E]/45" />
                  <span>{stage.label}</span>
                </div>
                <h3 className="max-w-[19ch] text-[clamp(2.05rem,6.8vw,4rem)] leading-[0.96] tracking-[-0.035em] text-cream">
                  {stage.title.map((line) => <span key={line} className="block">{line}</span>)}
                </h3>
                <p className="mt-5 max-w-[32rem] text-[0.92rem] leading-7 text-cream/60">{stage.body}</p>
              </div>
            </article>
          );
        })}
      </div>
      {reduced && <p className="sr-only">All nationwide service chapters are available without motion.</p>}
    </div>
  );
}

function DesktopScene({ stage, story, index }) {
  return (
    <article
      data-cinematic-scene
      className="pointer-events-none absolute bottom-[8.5vh] right-[clamp(3rem,7vw,8.5rem)] z-30 w-[min(45rem,52vw)] text-right will-change-[transform,opacity]"
    >
      <div data-scene-meta className="mb-5 flex items-center justify-end gap-4 text-[0.57rem] font-semibold uppercase tracking-[0.22em] text-cream/62">
        <span>{story.cities}</span>
        <span className="h-px w-12 bg-[#E3C47E]/55" />
        <span className="text-[#E3C47E]">0{index + 1} / 03</span>
      </div>
      <h3 className="ml-auto max-w-[17ch] text-[clamp(3.2rem,5.2vw,6rem)] leading-[0.88] tracking-[-0.045em] text-cream [text-shadow:0_5px_35px_rgba(0,0,0,.5)]">
        {stage.title.map((line) => (
          <span key={line} className="block overflow-hidden pb-[0.08em]">
            <span data-scene-line className="block will-change-transform">{line}</span>
          </span>
        ))}
      </h3>
      <p data-scene-copy className="ml-auto mt-5 max-w-[31rem] text-[0.92rem] leading-7 text-cream/68 [text-shadow:0_3px_20px_rgba(0,0,0,.65)]">
        {stage.body}
      </p>
    </article>
  );
}

export default function GlobalChauffeurMotion({ onSeePrices }) {
  const { lang } = useLang();
  const content = COPY[lang];
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const cinematicDesktop = useMediaQuery(DESKTOP_QUERY);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return undefined;

    const media = gsap.matchMedia();

    media.add(DESKTOP_QUERY, () => {
      const desktop = root.querySelector("[data-cinematic-desktop]");
      const stage = root.querySelector("[data-cinematic-stage]");
      const video = root.querySelector("[data-cinematic-video]");
      if (!desktop || !stage || !video) return undefined;

      let animationContext;
      let pointerCleanup;

      const buildExperience = () => {
        if (animationContext) return;
        video.pause();

        animationContext = gsap.context(() => {
          const videoPlane = root.querySelector("[data-video-plane]");
          const headline = root.querySelector("[data-cinematic-headline]");
          const headlineLines = gsap.utils.toArray("[data-headline-line]", root);
          const introSupport = gsap.utils.toArray("[data-intro-support]", root);
          const scenes = gsap.utils.toArray("[data-cinematic-scene]", root);
          const routeLines = gsap.utils.toArray("[data-route-line]", desktop);
          const progressItems = gsap.utils.toArray("[data-progress-stage]", root);
          const progressFills = gsap.utils.toArray("[data-progress-fill]", root);
          const cityNodes = gsap.utils.toArray("[data-city-node]", desktop);
          const map = root.querySelector("[data-route-map]");
          const filmFlash = root.querySelector("[data-film-flash]");
          const pointerLight = root.querySelector("[data-pointer-light]");
          const playhead = { time: 0.01 };
          const duration = Number.isFinite(video.duration) && video.duration > 1
            ? Math.max(1, video.duration - 0.08)
            : VIDEO_FALLBACK_DURATION;

          routeLines.forEach((path) => {
            const length = path.getTotalLength();
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          });

          gsap.set(headlineLines, { yPercent: 108 });
          gsap.set(introSupport, { autoAlpha: 0, y: 14 });
          gsap.set(scenes, { autoAlpha: 0 });
          gsap.set(scenes[0], { autoAlpha: 1 });
          gsap.set(progressItems, { opacity: 0.34 });
          gsap.set(progressItems[0], { opacity: 1 });
          gsap.set(progressFills, { scaleY: 0, transformOrigin: "top" });
          gsap.set(cityNodes, { opacity: 0.36 });
          gsap.set(map, { opacity: 0.56, scale: 1.04, transformOrigin: "center" });
          gsap.set(videoPlane, { scale: 1.075 });
          gsap.set(video, { opacity: 1 });

          scenes.forEach((scene, index) => {
            const lines = gsap.utils.toArray("[data-scene-line]", scene);
            const meta = scene.querySelector("[data-scene-meta]");
            const copy = scene.querySelector("[data-scene-copy]");
            if (index === 0) {
              gsap.set(lines, { yPercent: 0 });
              gsap.set([meta, copy], { autoAlpha: 1, y: 0 });
            } else {
              gsap.set(lines, { yPercent: 112 });
              gsap.set([meta, copy], { autoAlpha: 0, y: 12 });
            }
          });

          const seekVideo = () => {
            if (Math.abs(video.currentTime - playhead.time) > 0.028) video.currentTime = playhead.time;
          };

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: desktop,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.45,
              invalidateOnRefresh: true,
              id: "nationwide-cinematic",
            },
          });

          timeline
            .to(playhead, { time: duration, duration: 10, onUpdate: seekVideo }, 0)
            .to(videoPlane, { scale: 1.005, duration: 10 }, 0)
            .to(map, { scale: 0.97, opacity: 0.72, duration: 10 }, 0)
            .to(headlineLines, { yPercent: 0, duration: 0.72, stagger: 0.08, ease: MOTION.ease.premiumOut }, 0.08)
            .to(introSupport, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.08, ease: MOTION.ease.premiumOut }, 0.28)
            .to(routeLines[0], { strokeDashoffset: 0, duration: 2.25 }, 0.2)
            .to(progressFills[0], { scaleY: 1, duration: 2.35 }, 0.18)
            .to(headline, { autoAlpha: 0, yPercent: -9, duration: 0.62, ease: "power2.inOut" }, 1.8)
            .to(scenes[0].querySelectorAll("[data-scene-line]"), { yPercent: -112, duration: 0.48, stagger: 0.045, ease: "power3.in" }, 2.35)
            .to([scenes[0].querySelector("[data-scene-meta]"), scenes[0].querySelector("[data-scene-copy]")], { autoAlpha: 0, y: -12, duration: 0.3 }, 2.32)
            .to(filmFlash, { autoAlpha: 0.22, duration: 0.16, ease: "power2.out" }, 2.48)
            .to(filmFlash, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 2.64)
            .set(progressItems[0], { opacity: 0.34 }, 2.55)
            .set(progressItems[1], { opacity: 1 }, 2.55)
            .set(scenes[1], { autoAlpha: 1 }, 2.56)
            .to(scenes[1].querySelectorAll("[data-scene-line]"), { yPercent: 0, duration: 0.68, stagger: 0.055, ease: MOTION.ease.premiumOut }, 2.64)
            .to([scenes[1].querySelector("[data-scene-meta]"), scenes[1].querySelector("[data-scene-copy]")], { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.05, ease: MOTION.ease.premiumOut }, 2.78)
            .set(scenes[0], { autoAlpha: 0 }, 2.94)
            .to(routeLines[1], { strokeDashoffset: 0, duration: 3.05 }, 2.62)
            .to(progressFills[1], { scaleY: 1, duration: 3.02 }, 2.58)
            .to(cityNodes, { opacity: 0.92, duration: 1.1, stagger: 0.05 }, 3.0)
            .to(scenes[1].querySelectorAll("[data-scene-line]"), { yPercent: -112, duration: 0.48, stagger: 0.045, ease: "power3.in" }, 5.65)
            .to([scenes[1].querySelector("[data-scene-meta]"), scenes[1].querySelector("[data-scene-copy]")], { autoAlpha: 0, y: -12, duration: 0.3 }, 5.62)
            .to(filmFlash, { autoAlpha: 0.18, duration: 0.16, ease: "power2.out" }, 5.78)
            .to(filmFlash, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 5.94)
            .set(progressItems[1], { opacity: 0.34 }, 5.84)
            .set(progressItems[2], { opacity: 1 }, 5.84)
            .set(scenes[2], { autoAlpha: 1 }, 5.84)
            .to(scenes[2].querySelectorAll("[data-scene-line]"), { yPercent: 0, duration: 0.68, stagger: 0.055, ease: MOTION.ease.premiumOut }, 5.92)
            .to([scenes[2].querySelector("[data-scene-meta]"), scenes[2].querySelector("[data-scene-copy]")], { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.05, ease: MOTION.ease.premiumOut }, 6.06)
            .set(scenes[1], { autoAlpha: 0 }, 6.2)
            .to(routeLines[2], { strokeDashoffset: 0, duration: 2.7 }, 5.92)
            .to(progressFills[2], { scaleY: 1, duration: 3.35 }, 5.86)
            .to(map, { xPercent: -1.5, yPercent: -1, duration: 3.5 }, 6.0)
            .to({}, { duration: 0.45 });

          const finePointer = window.matchMedia("(pointer: fine)");
          if (finePointer.matches && pointerLight) {
            const moveX = gsap.quickTo(pointerLight, "xPercent", { duration: 0.8, ease: "power3.out" });
            const moveY = gsap.quickTo(pointerLight, "yPercent", { duration: 0.8, ease: "power3.out" });
            const handlePointer = (event) => {
              const bounds = stage.getBoundingClientRect();
              moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 16);
              moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
            };
            const resetPointer = () => {
              moveX(0);
              moveY(0);
            };
            stage.addEventListener("pointermove", handlePointer, { passive: true });
            stage.addEventListener("pointerleave", resetPointer);
            pointerCleanup = () => {
              stage.removeEventListener("pointermove", handlePointer);
              stage.removeEventListener("pointerleave", resetPointer);
            };
          }
        }, root);
      };

      if (video.readyState >= 1) buildExperience();
      else video.addEventListener("loadedmetadata", buildExperience, { once: true });

      return () => {
        video.removeEventListener("loadedmetadata", buildExperience);
        pointerCleanup?.();
        video.pause();
        animationContext?.revert();
      };
    }, root);

    return () => media.revert();
  }, [cinematicDesktop, lang, reduced]);

  return (
    <section ref={rootRef} id="nationwide-service" className="relative overflow-clip bg-[#0A0806] text-cream">
      {cinematicDesktop ? (
          <div data-cinematic-desktop className="relative h-[390vh]">
            <div data-cinematic-stage className="sticky top-0 h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#080706]">
              <div data-video-plane className="absolute inset-[-3%] will-change-transform">
                <video
                  data-cinematic-video
                  className="h-full w-full object-cover"
                  poster="/images/optimized/hero-1280.webp"
                  preload="metadata"
                  muted
                  playsInline
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <source src="/video/afsahi-nationwide.mp4" type="video/mp4" />
                  <source src="/video/afsahi-nationwide.webm" type="video/webm" />
                </video>
              </div>

              <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,6,4,.8)_0%,rgba(7,6,4,.36)_38%,rgba(7,6,4,.06)_66%,rgba(7,6,4,.34)_100%),linear-gradient(180deg,rgba(7,6,4,.48)_0%,rgba(7,6,4,.02)_42%,rgba(7,6,4,.56)_100%)]" />
              <div className="pointer-events-none absolute inset-0 z-10 opacity-80 [background:radial-gradient(circle_at_72%_46%,transparent_0%,rgba(7,6,4,.12)_34%,rgba(7,6,4,.72)_100%)]" />
              <div data-pointer-light className="pointer-events-none absolute left-[44%] top-[18%] z-10 h-[70vh] w-[70vh] rounded-full opacity-55 [background:radial-gradient(circle,rgba(205,168,95,.12)_0%,rgba(205,168,95,.035)_38%,transparent_70%)] will-change-transform" />
              <div data-film-flash className="pointer-events-none absolute inset-0 z-20 bg-[#CDA85F] opacity-0 mix-blend-soft-light" />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#E3C47E]/65 to-transparent" />

              <div className="pointer-events-none absolute inset-y-[8%] right-[-5%] z-20 w-[72%] opacity-90">
                <div data-route-map className="h-full w-full will-change-transform">
                  <RouteNetwork />
                </div>
              </div>

              <div className="absolute left-[clamp(2rem,4.8vw,6rem)] right-[clamp(2rem,4.8vw,6rem)] top-[9.5vh] z-40 flex items-center justify-between text-[0.54rem] font-semibold uppercase tracking-[0.23em] text-cream/56">
                <span>{content.network}</span>
                <span className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#E3C47E]" />{content.signal}</span>
              </div>

              <header data-cinematic-headline className="absolute left-[clamp(2rem,6vw,7.5rem)] top-[14vh] z-30 w-[min(47rem,52vw)] will-change-[transform,opacity]">
                <span data-intro-support className="eyebrow eyebrow--ondark mb-6">{content.kicker}</span>
                <h2 className="max-w-[10ch] text-[clamp(4.3rem,7.35vw,8.7rem)] leading-[0.82] tracking-[-0.055em] text-cream [text-shadow:0_5px_45px_rgba(0,0,0,.58)]">
                  {content.title.map((line) => (
                    <span key={line} className="block overflow-hidden pb-[0.12em]">
                      <span data-headline-line className="block will-change-transform">{line}</span>
                    </span>
                  ))}
                </h2>
                <p data-intro-support className="mt-5 max-w-[30rem] text-[0.95rem] leading-7 text-cream/67 [text-shadow:0_3px_24px_rgba(0,0,0,.7)]">{content.body}</p>
                <div data-intro-support>
                  <JourneyButton onClick={onSeePrices}>{content.cta}</JourneyButton>
                </div>
              </header>

              {content.stages.map((stage, index) => (
                <DesktopScene key={stage.label} stage={stage} story={STORIES[index]} index={index} />
              ))}

              <ol aria-label={content.progress} className="absolute right-[clamp(2rem,4.8vw,6rem)] top-[11.5vh] z-40 flex h-[29vh] flex-col justify-between">
                {content.stages.map((stage, index) => (
                  <li key={stage.label} data-progress-stage className="relative flex min-h-[3.75rem] items-center justify-end gap-4 pr-5 text-right text-[0.52rem] font-semibold uppercase tracking-[0.19em] text-cream will-change-opacity">
                    <span className="absolute bottom-0 right-0 top-0 w-px bg-cream/15">
                      <span data-progress-fill className="block h-full w-px bg-[#E3C47E] will-change-transform" />
                    </span>
                    <span>{stage.label}</span>
                    <span className="text-[#E3C47E]">0{index + 1}</span>
                  </li>
                ))}
              </ol>

              <p className="pointer-events-none absolute bottom-[3.2vh] right-[clamp(2rem,4.8vw,6rem)] z-40 text-[0.5rem] font-semibold uppercase tracking-[0.2em] text-cream/38">
                35.76° N — 30.42° N / AFSAHI
              </p>
            </div>
          </div>
      ) : (
        <StackedStories content={content} onSeePrices={onSeePrices} reduced={reduced} />
      )}
    </section>
  );
}
