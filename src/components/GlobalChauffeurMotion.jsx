import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLang } from "../context/LanguageContext.jsx";
import { gsap, MOTION } from "../lib/motion.js";

// ─────────────────────────────────────────────────────────────────────────────
// "Luxury Chauffeur Across Morocco" — pinned cinematic, photo-driven.
//
// Three full-bleed chauffeur photographs are stacked as clip-path layers and
// driven by ONE scrubbed GSAP master timeline (no background video). Each
// chapter reveals its image with a distinct editorial mask (box expand →
// wipe-from-right → centre crop-expansion), pushes the frame with a restrained
// 1.1→1.0 camera move, draws its Morocco route segment, activates its cities
// and reveals a masked headline — image, route and type moving as one system.
//
// Desktop (≥1024) runs at full intensity; tablet (768–1023) uses a shorter pin
// and lighter movement via gsap.matchMedia. Below 768px, or under
// prefers-reduced-motion, the section degrades to three full-bleed stacked
// stories in normal document flow (no pin, no scrub).
// ─────────────────────────────────────────────────────────────────────────────

const CINEMATIC_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const DESKTOP_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)";

const IMG = "/images/optimized/nationwide";

// clipHidden — each layer's start state (fully hidden). clip animates to
// inset(0%…) to reveal. text.pos places each chapter's headline intentionally.
const STORIES = [
  {
    id: "airport",
    base: "arrival-door",
    position: "center 42%",
    clipFrom: "inset(9% 9% 9% 9%)",          // box expand (first chapter is already the visible base layer)
    caption: "Casablanca · CMN",
    activate: ["Casablanca"],
    text: { pos: "left-[clamp(2rem,6vw,7rem)] bottom-[13vh]", align: "left" },
    eager: true,
  },
  {
    id: "service",
    base: "service-umbrella",
    position: "center 32%",
    clipFrom: "inset(0% 0% 0% 100%)",        // editorial wipe from the right
    caption: "Rabat · Marrakech",
    activate: ["Rabat", "Marrakech"],
    text: { pos: "right-[clamp(2rem,6vw,7rem)] bottom-[13vh]", align: "right" },
    eager: false,
  },
  {
    id: "executive",
    base: "executive-exit",
    position: "center 46%",
    clipFrom: "inset(50% 0% 50% 0%)",        // centre crop-expansion
    caption: "Casablanca → Agadir",
    activate: ["Agadir"],
    text: { pos: "left-[clamp(2rem,6vw,7rem)] bottom-[15vh]", align: "left" },
    eager: false,
  },
];

const CLIP_FULL = "inset(0% 0% 0% 0%)";

const COPY = {
  en: {
    kicker: "Nationwide service",
    brand: ["One standard,", "across Morocco."],
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
        alt: "An AFSAHI chauffeur opening the door of a black Mercedes S-Class for an arriving passenger",
      },
      {
        label: "Chauffeur service",
        title: ["Care at", "every step"],
        body: "Discreet chauffeur service, thoughtful assistance and seamless coordination.",
        alt: "An AFSAHI chauffeur holding an umbrella for a client beside a black Mercedes",
      },
      {
        label: "Executive day",
        title: ["Executive mobility,", "all day"],
        body: "Meetings, events and private schedules handled with precision.",
        alt: "An executive stepping out of a black Mercedes S-Class",
      },
    ],
  },
  fr: {
    kicker: "Service national",
    brand: ["Une exigence,", "partout au Maroc."],
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
        alt: "Un chauffeur AFSAHI ouvrant la portière d’une Mercedes Classe S noire pour une passagère",
      },
      {
        label: "Service chauffeur",
        title: ["Un soin à", "chaque étape"],
        body: "Service de chauffeur discret, assistance attentive et coordination sans faille.",
        alt: "Un chauffeur AFSAHI tenant un parapluie pour une cliente près d’une Mercedes noire",
      },
      {
        label: "Journée exécutive",
        title: ["Une mobilité exécutive,", "toute la journée"],
        body: "Réunions, événements et programmes privés gérés avec précision.",
        alt: "Une passagère descendant d’une Mercedes Classe S noire",
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

function ChapterImage({ story, alt, className = "" }) {
  return (
    <img
      src={`${IMG}/${story.base}-1280.webp`}
      srcSet={`${IMG}/${story.base}-768.webp 768w, ${IMG}/${story.base}-1280.webp 1280w, ${IMG}/${story.base}-1920.webp 1920w`}
      sizes="100vw"
      width={1920}
      height={1282}
      alt={alt}
      draggable={false}
      loading={story.eager ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: story.position }}
    />
  );
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
      <g opacity={compact ? 0.32 : 0.18}>
        <path d="M420 72C434 126 452 176 472 216C445 244 412 270 378 292C406 350 449 404 486 452C434 504 378 548 326 578" stroke="#F6F2EA" strokeWidth="1" />
        <path d="M472 216C532 181 598 174 664 196" stroke="#F6F2EA" strokeWidth="1" />
        <path d="M378 292C465 310 548 352 588 422" stroke="#F6F2EA" strokeWidth="1" strokeDasharray="3 8" />
        <path d="M486 452C574 484 624 532 680 612" stroke="#F6F2EA" strokeWidth="1" strokeDasharray="3 8" />
      </g>

      <path data-route-line="0" d="M378 292C405 264 442 238 472 216M378 292C414 348 456 407 486 452" stroke="#E3C47E" strokeWidth={compact ? 2.2 : 1.7} strokeLinecap="round" />
      <path data-route-line="1" d="M420 72C434 126 452 176 472 216C445 244 412 270 378 292C406 350 449 404 486 452C434 504 378 548 326 578M472 216C532 181 598 174 664 196" stroke="#E3C47E" strokeWidth={compact ? 2.2 : 1.7} strokeLinecap="round" />
      <path data-route-line="2" d="M378 292C438 262 516 264 552 309C589 355 554 422 486 452C422 421 370 365 378 292" stroke="#E3C47E" strokeWidth={compact ? 2.2 : 1.7} strokeLinecap="round" />

      {CITIES.map((city) => (
        <g key={city.name} data-city-node={city.name} transform={`translate(${city.x} ${city.y})`}>
          <circle data-city-halo r={compact ? 12 : 17} fill="rgba(227,196,126,.08)" style={{ transformOrigin: "center", transformBox: "fill-box" }} />
          <circle r="3.5" fill="#E3C47E" />
          <text x={city.align === "end" ? -18 : 18} y="4" textAnchor={city.align} fill="rgba(246,242,234,.78)" fontSize={compact ? 16 : 13} letterSpacing="2.2">
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
      className={`group pointer-events-auto relative inline-flex min-h-12 items-center overflow-hidden text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#E3C47E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#E3C47E] active:translate-y-px ${compact ? "mt-7" : "mt-7"}`}
    >
      <span className="relative pb-2">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-100 bg-[#E3C47E]/70 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:origin-left group-hover:scale-x-0" />
      </span>
      <span className="ml-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E3C47E]/35 transition-[transform,border-color,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 group-hover:border-[#F6F2EA]/70 group-hover:text-[#F6F2EA]" aria-hidden="true">↗</span>
    </button>
  );
}

function DesktopScene({ story, stage, index }) {
  const right = story.text.align === "right";
  return (
    <article
      data-cinematic-scene
      className={`pointer-events-none absolute z-30 w-[min(42rem,52vw)] ${story.text.pos} ${right ? "text-right" : "text-left"} will-change-[transform,opacity]`}
    >
      <div data-scene-meta className={`mb-5 flex items-center gap-4 text-[0.57rem] font-semibold uppercase tracking-[0.22em] text-cream/64 ${right ? "justify-end" : ""}`}>
        {right ? (
          <>
            <span>{stage.label}</span>
            <span className="h-px w-12 bg-[#E3C47E]/55" />
            <span className="text-[#E3C47E]">0{index + 1} / 03</span>
          </>
        ) : (
          <>
            <span className="text-[#E3C47E]">0{index + 1} / 03</span>
            <span className="h-px w-12 bg-[#E3C47E]/55" />
            <span>{stage.label}</span>
          </>
        )}
      </div>
      <h3 className={`max-w-[16ch] text-[clamp(2.9rem,5vw,5.7rem)] leading-[0.9] tracking-[-0.045em] text-cream [text-shadow:0_6px_40px_rgba(0,0,0,.55)] ${right ? "ml-auto" : ""}`}>
        {stage.title.map((line) => (
          <span key={line} className="block overflow-hidden pb-[0.08em]">
            <span data-scene-line className="block will-change-transform">{line}</span>
          </span>
        ))}
      </h3>
      <p data-scene-copy className={`mt-5 max-w-[30rem] text-[0.94rem] leading-7 text-cream/74 [text-shadow:0_3px_22px_rgba(0,0,0,.7)] ${right ? "ml-auto" : ""}`}>
        {stage.body}
      </p>
    </article>
  );
}

// ── Master timeline, shared by desktop (intensity 1) and tablet (intensity ~0.6)
function buildCinematic({ root, stage, pin, intensity }) {
  const ctx = gsap.context(() => {
    const layers = gsap.utils.toArray("[data-chapter-layer]", stage);
    const media = layers.map((layer) => layer.querySelector("[data-chapter-media]"));
    const scenes = gsap.utils.toArray("[data-cinematic-scene]", stage);
    const routeLines = gsap.utils.toArray("[data-route-line]", stage);
    const routeMap = stage.querySelector("[data-route-map]");
    const progressItems = gsap.utils.toArray("[data-progress-stage]", stage);
    const progressFills = gsap.utils.toArray("[data-progress-fill]", stage);
    const filmFlash = stage.querySelector("[data-film-flash]");
    const lighting = stage.querySelector("[data-lighting]");

    const cityByName = {};
    gsap.utils.toArray("[data-city-node]", stage).forEach((node) => {
      cityByName[node.getAttribute("data-city-node")] = node;
    });

    const S = intensity;
    const sceneLines = (i) => scenes[i].querySelectorAll("[data-scene-line]");
    const sceneAux = (i) => [scenes[i].querySelector("[data-scene-meta]"), scenes[i].querySelector("[data-scene-copy]")];

    // Initial states — every layer hidden except the base, headlines masked out.
    routeLines.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.set(layers[0], { clipPath: STORIES[0].clipFrom });
    gsap.set(media[0], { scale: 1 + 0.12 * S, xPercent: -1.6 * S });
    gsap.set(layers[1], { clipPath: STORIES[1].clipFrom });
    gsap.set(media[1], { scale: 1 + 0.1 * S, xPercent: -1.2 * S });
    gsap.set(layers[2], { clipPath: STORIES[2].clipFrom });
    gsap.set(media[2], { scale: 1 + 0.12 * S });
    gsap.set(routeMap, { opacity: 0.5, scale: 1.03, transformOrigin: "center" });
    gsap.set(Object.values(cityByName), { opacity: 0.34 });
    scenes.forEach((_, i) => {
      gsap.set(sceneLines(i), { yPercent: 112 });
      gsap.set(sceneAux(i), { autoAlpha: 0, y: 12 });
    });
    gsap.set(scenes, { autoAlpha: 0 });
    gsap.set(progressItems, { opacity: 0.34 });
    gsap.set(progressItems[0], { opacity: 1 });
    gsap.set(progressFills, { scaleY: 0, transformOrigin: "top" });

    const activateCities = (tl, names, at) => {
      names.forEach((name, idx) => {
        const node = cityByName[name];
        if (!node) return;
        const halo = node.querySelector("[data-city-halo]");
        tl.to(node, { opacity: 1, duration: 0.5, ease: MOTION.ease.refinedOut }, at + idx * 0.06);
        if (halo) {
          tl.fromTo(halo, { scale: 0.7, opacity: 0.35 }, { scale: 1.55, opacity: 0.12, duration: 0.5, ease: "power2.out" }, at + idx * 0.06);
        }
      });
    };

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
        id: "nationwide-cinematic",
      },
    });

    // ── Chapter 1 — Airport arrival (box reveal + slow push/drift)
    tl.to(layers[0], { clipPath: CLIP_FULL, duration: 0.85, ease: MOTION.ease.premiumOut }, 0.0)
      .to(media[0], { scale: 1, xPercent: 1.6 * S, duration: 2.6 }, 0.0)
      .set(scenes[0], { autoAlpha: 1 }, 0.32)
      .to(sceneLines(0), { yPercent: 0, duration: 0.72, stagger: 0.08, ease: MOTION.ease.premiumOut }, 0.35)
      .to(sceneAux(0), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: MOTION.ease.premiumOut }, 0.55)
      .to(routeLines[0], { strokeDashoffset: 0, duration: 1.5 }, 0.4)
      .to(progressFills[0], { scaleY: 1, duration: 2.4 }, 0.2);
    activateCities(tl, STORIES[0].activate, 0.5);

    // exit chapter 1
    tl.to(sceneLines(0), { yPercent: -112, duration: 0.5, stagger: 0.05, ease: "power3.in" }, 2.55)
      .to(sceneAux(0), { autoAlpha: 0, y: -12, duration: 0.32 }, 2.55)
      .set(scenes[0], { autoAlpha: 0 }, 3.05);

    // ── Chapter 2 — Chauffeur service (editorial wipe from right)
    tl.to(layers[1], { clipPath: CLIP_FULL, duration: 0.95, ease: MOTION.ease.premiumOut }, 2.7)
      .to(media[1], { scale: 1, xPercent: 1.2 * S, duration: 3.0 }, 2.7)
      .fromTo(filmFlash, { autoAlpha: 0 }, { autoAlpha: 0.16 * S, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, 2.72)
      .to(lighting, { opacity: 0.5, duration: 1.0 }, 2.7)
      .set(scenes[1], { autoAlpha: 1 }, 3.1)
      .to(sceneLines(1), { yPercent: 0, duration: 0.72, stagger: 0.08, ease: MOTION.ease.premiumOut }, 3.12)
      .to(sceneAux(1), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: MOTION.ease.premiumOut }, 3.3)
      .to(routeLines[1], { strokeDashoffset: 0, duration: 2.1 }, 3.0)
      .to(progressFills[1], { scaleY: 1, duration: 3.0 }, 2.8)
      .to(routeMap, { scale: 0.99, opacity: 0.62, duration: 3.0 }, 2.8);
    activateCities(tl, STORIES[1].activate, 3.2);

    // exit chapter 2
    tl.to(sceneLines(1), { yPercent: -112, duration: 0.5, stagger: 0.05, ease: "power3.in" }, 5.55)
      .to(sceneAux(1), { autoAlpha: 0, y: -12, duration: 0.32 }, 5.55)
      .set(scenes[1], { autoAlpha: 0 }, 6.05);

    // ── Chapter 3 — Executive mobility (centre crop-expansion + zoom-out)
    tl.to(layers[2], { clipPath: CLIP_FULL, duration: 1.0, ease: MOTION.ease.premiumOut }, 5.7)
      .to(media[2], { scale: 1, duration: 3.0 }, 5.7)
      .fromTo(filmFlash, { autoAlpha: 0 }, { autoAlpha: 0.14 * S, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, 5.72)
      .to(lighting, { opacity: 0.34, duration: 1.0 }, 5.7)
      .set(scenes[2], { autoAlpha: 1 }, 6.1)
      .to(sceneLines(2), { yPercent: 0, duration: 0.72, stagger: 0.08, ease: MOTION.ease.premiumOut }, 6.12)
      .to(sceneAux(2), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: MOTION.ease.premiumOut }, 6.3)
      .to(routeLines[2], { strokeDashoffset: 0, duration: 2.4 }, 6.0)
      .to(progressFills[2], { scaleY: 1, duration: 3.2 }, 5.85)
      .to(routeMap, { scale: 1.0, opacity: 0.7, xPercent: -1.4 * S, duration: 3.4 }, 6.0);
    activateCities(tl, STORIES[2].activate, 6.2);
    tl.to(Object.values(cityByName), { opacity: 0.95, duration: 1.0, stagger: 0.04 }, 6.3)
      .to({}, { duration: 0.5 });

    // Progress rail highlight switches
    tl.set(progressItems[0], { opacity: 0.34 }, 2.6).set(progressItems[1], { opacity: 1 }, 2.6);
    tl.set(progressItems[1], { opacity: 0.34 }, 5.6).set(progressItems[2], { opacity: 1 }, 5.6);
  }, root);

  return ctx;
}

function StackedStories({ content, onSeePrices, reduced }) {
  const [shown, setShown] = useState(() => (reduced ? [true, true, true] : [false, false, false]));
  const rootRef = useRef(null);

  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;
    const panels = [...rootRef.current.querySelectorAll("[data-stack-story]")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = panels.indexOf(entry.target);
        setShown((prev) => {
          if (prev[index]) return prev;
          const next = [...prev];
          next[index] = true;
          return next;
        });
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div ref={rootRef} data-cinematic-fallback>
      <header className="wrap py-20 sm:py-24">
        <span className="eyebrow eyebrow--ondark">{content.kicker}</span>
        <h2 className="mt-6 max-w-[12ch] text-[clamp(2.8rem,10vw,4.6rem)] leading-[0.92] tracking-[-0.04em] text-cream">
          {content.brand.map((line) => <span key={line} className="block">{line}</span>)}
        </h2>
        <p className="mt-6 max-w-[34rem] text-[0.98rem] leading-7 text-cream/64">{content.body}</p>
        <JourneyButton onClick={onSeePrices} compact>{content.cta}</JourneyButton>
      </header>

      <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-5">
        {STORIES.map((story, index) => {
          const stage = content.stages[index];
          return (
            <article
              key={story.id}
              data-stack-story
              className={`relative h-[80svh] min-h-[26rem] w-full overflow-hidden rounded-[1.6rem] bg-[#0A0907] transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] ${shown[index] ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            >
              <div className="absolute inset-0 will-change-transform" style={{ transform: shown[index] ? "scale(1)" : "scale(1.06)", transition: "transform 1200ms cubic-bezier(.16,1,.3,1)" }}>
                <ChapterImage story={story} alt={stage.alt} />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,5,.04),rgba(8,7,5,.18)_46%,rgba(8,7,5,.82))]" />
              {index === 1 && (
                <div className="pointer-events-none absolute inset-y-[10%] right-[-14%] w-[78%] opacity-80">
                  <RouteNetwork compact />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3 text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
                  <span className="text-[#E3C47E]">0{index + 1} / 03</span>
                  <span className="h-px w-8 bg-[#E3C47E]/50" />
                  <span>{stage.label}</span>
                </div>
                <h3 className="max-w-[18ch] text-[clamp(1.9rem,7.4vw,2.9rem)] leading-[0.98] tracking-[-0.03em] text-cream">
                  {stage.title.map((line) => <span key={line} className="block">{line}</span>)}
                </h3>
                <p className="mt-3 max-w-[34rem] text-[0.9rem] leading-7 text-cream/72">{stage.body}</p>
                <p className="mt-4 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-cream/55">{story.caption}</p>
              </div>
            </article>
          );
        })}
      </div>
      {reduced && <p className="sr-only">All nationwide service chapters are shown without motion.</p>}
    </div>
  );
}

export default function GlobalChauffeurMotion({ onSeePrices }) {
  const { lang } = useLang();
  const content = COPY[lang];
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const cinematic = useMediaQuery(CINEMATIC_QUERY);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !cinematic) return undefined;

    const media = gsap.matchMedia();
    const attach = (query, intensity) => {
      media.add(query, () => {
        const pin = root.querySelector("[data-cinematic-pin]");
        const stage = root.querySelector("[data-cinematic-stage]");
        if (!pin || !stage) return undefined;
        const ctx = buildCinematic({ root, stage, pin, intensity });
        return () => ctx.revert();
      });
    };
    attach(DESKTOP_QUERY, 1);
    attach(TABLET_QUERY, 0.62);

    return () => media.revert();
  }, [cinematic, reduced, lang]);

  return (
    <section ref={rootRef} id="nationwide-service" className="relative overflow-clip bg-[#0A0806] text-cream">
      {cinematic ? (
        <div data-cinematic-pin className="relative h-[300vh] lg:h-[380vh]">
          <div data-cinematic-stage className="sticky top-0 h-[100svh] min-h-[620px] w-full overflow-hidden bg-[#080706]">
            {/* Photo layers */}
            {STORIES.map((story, index) => (
              <div
                key={story.id}
                data-chapter-layer
                className="absolute inset-0 will-change-[clip-path]"
                style={{ zIndex: 1 + index, clipPath: story.clipFrom }}
              >
                <div data-chapter-media className="absolute inset-0 will-change-transform">
                  <ChapterImage story={story} alt={content.stages[index].alt} />
                </div>
              </div>
            ))}

            {/* Legibility + lighting overlays */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,6,4,.74)_0%,rgba(7,6,4,.3)_36%,rgba(7,6,4,.04)_64%,rgba(7,6,4,.36)_100%),linear-gradient(180deg,rgba(7,6,4,.42)_0%,rgba(7,6,4,.02)_44%,rgba(7,6,4,.6)_100%)]" />
            <div data-lighting className="pointer-events-none absolute inset-0 z-10 opacity-70 [background:radial-gradient(circle_at_68%_44%,transparent_0%,rgba(7,6,4,.1)_36%,rgba(7,6,4,.68)_100%)]" />
            <div data-film-flash className="pointer-events-none absolute inset-0 z-20 bg-[#CDA85F] opacity-0 mix-blend-soft-light" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#E3C47E]/60 to-transparent" />

            {/* Morocco route network */}
            <div className="pointer-events-none absolute inset-y-[9%] right-[-5%] z-20 w-[70%] opacity-90">
              <div data-route-map className="h-full w-full will-change-transform">
                <RouteNetwork />
              </div>
            </div>

            {/* Persistent brand lockup + CTA (top-left) */}
            <div className="absolute left-[clamp(2rem,6vw,7rem)] top-[13vh] z-40 w-[min(24rem,42vw)]">
              <span className="eyebrow eyebrow--ondark mb-4">{content.kicker}</span>
              <p className="max-w-[14ch] text-[clamp(1.5rem,2.1vw,2.2rem)] font-medium leading-[1.05] tracking-[-0.02em] text-cream/92 [text-shadow:0_3px_22px_rgba(0,0,0,.6)]">
                {content.brand.map((line) => <span key={line} className="block">{line}</span>)}
              </p>
              <JourneyButton onClick={onSeePrices}>{content.cta}</JourneyButton>
            </div>

            {/* Top meta bar */}
            <div className="absolute left-[clamp(2rem,4.8vw,6rem)] right-[clamp(2rem,4.8vw,6rem)] top-[6.5vh] z-40 flex items-center justify-between text-[0.54rem] font-semibold uppercase tracking-[0.23em] text-cream/56">
              <span>{content.network}</span>
              <span className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#E3C47E]" />{content.signal}</span>
            </div>

            {/* Chapter scenes */}
            {content.stages.map((stage, index) => (
              <DesktopScene key={stage.label} story={STORIES[index]} stage={stage} index={index} />
            ))}

            {/* Progress rail */}
            <ol aria-label={content.progress} className="absolute right-[clamp(2rem,4.8vw,6rem)] top-[25vh] z-40 flex h-[19vh] flex-col justify-between">
              {content.stages.map((stage, index) => (
                <li key={stage.label} data-progress-stage className="relative flex min-h-[3.5rem] items-center justify-end gap-4 pr-5 text-right text-[0.52rem] font-semibold uppercase tracking-[0.19em] text-cream">
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
