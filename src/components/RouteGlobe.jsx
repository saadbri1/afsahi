/**
 * RouteGlobe — "Global Chauffeur Network"
 * Premium SVG globe with a real fleet vehicle travelling the route.
 * CSS/SVG/Framer Motion only — no Three.js, no WebGL, no video.
 * Pauses rAF when off-screen. Respects prefers-reduced-motion.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLang } from "../context/LanguageContext.jsx";

/* ── SVG coordinate constants ──────────────────────────── */
const VB = 500; // viewBox is VB × VB
const CX = 252, CY = 252, R = 188; // globe centre / radius

// Closed great-circle-style route that wraps around the globe
const ROUTE =
  "M 112 318 " +
  "C  72 178  148  72 252  68 " +
  "C 356  72  432 178  392 318 " +
  "C 370 398  314 424  252 418 " +
  "C 190 424  134 398  112 318 Z";

// City stops as fraction of path length (0–1)
const CITIES = [
  { t: 0.01, label: "Casablanca" },
  { t: 0.20, label: "Rabat" },
  { t: 0.44, label: "Tangier" },
  { t: 0.65, label: "Marrakech" },
  { t: 0.83, label: "Agadir" },
];

/* ── Helpers ───────────────────────────────────────────── */
function tangentAngle(pathEl, t) {
  const len   = pathEl.getTotalLength();
  const ahead = Math.min(t + 0.007, 0.999);
  const a     = pathEl.getPointAtLength(t * len);
  const b     = pathEl.getPointAtLength(ahead * len);
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

/* ── Component ─────────────────────────────────────────── */
export default function RouteGlobe({
  /** Real fleet vehicle PNG (transparent background preferred) */
  carImage       = "/images/cars/1.png",
  headline       = "Wherever you land, we're already on the route.",
  subline        = "Premium chauffeur service across Morocco — airport, city, door to door.",
  ctaText        = "Book Your Ride",
  onCta,
}) {
  const { t }        = useLang();
  const sectionRef   = useRef(null);
  const svgRef       = useRef(null);
  const pathRef      = useRef(null);   // invisible reference path
  const carRef       = useRef(null);   // <g> that holds the car
  const rafRef       = useRef(null);
  const progressRef  = useRef(0);
  const lastTsRef    = useRef(null);
  const runningRef   = useRef(false);
  const hoverRef     = useRef(false);

  const reduce = useReducedMotion();

  const [pins,      setPins]    = useState([]);
  const [tooltip,   setTooltip] = useState(null);
  const [revealed,  setRevealed] = useState(false); // drives fade-in via scroll listener
  const inViewRef = useRef(false);

  /* ── Visibility check via scroll event ───────────────────
     Lenis scrolls document.documentElement.scrollTop while
     keeping body.scrollTop = 0, so IntersectionObserver and
     Framer Motion's useInView never fire.  We replicate the
     check using getBoundingClientRect() on every scroll event,
     exactly like Fleet.jsx does for its card reveals.
  ──────────────────────────────────────────────────────── */
  // Reduced motion: reveal immediately (no animation to drive it via scroll)
  useEffect(() => { if (reduce) setRevealed(true); }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const el = sectionRef.current;
    if (!el) return;

    const check = () => {
      const { top, bottom } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = bottom > -120 && top < vh + 120;
      // Reveal fade-in the first time section enters view
      if (visible) setRevealed(true);
      if (visible !== inViewRef.current) {
        inViewRef.current = visible;
        if (visible && !runningRef.current) {
          runningRef.current = true;
          lastTsRef.current  = null;
          rafRef.current = requestAnimationFrame(tick);
        } else if (!visible) {
          runningRef.current = false;
          cancelAnimationFrame(rafRef.current);
        }
      }
    };

    check(); // run immediately on mount
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  /* ── Compute pin positions once path mounts ──────────── */
  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;
    const len = pathEl.getTotalLength();
    const computed = CITIES.map(c => ({
      ...c,
      x: pathEl.getPointAtLength(c.t * len).x,
      y: pathEl.getPointAtLength(c.t * len).y,
    }));
    setPins(computed);

    // Place car statically for reduced-motion
    if (reduce && carRef.current) {
      const pt  = pathEl.getPointAtLength(0.64 * len);
      const ang = tangentAngle(pathEl, 0.64);
      const dep = Math.max(0, Math.min(1, (pt.y - 68) / 350));
      carRef.current.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(${0.65 + 0.35 * dep})`
      );
    }
  }, [reduce]);

  /* ── rAF loop ─────────────────────────────────────────── */
  const tick = useCallback((ts) => {
    if (!runningRef.current) return;

    if (!lastTsRef.current) lastTsRef.current = ts;
    const delta = ts - lastTsRef.current;
    lastTsRef.current = ts;

    const speed  = hoverRef.current ? 0.35 : 1;
    const LOOP   = 20000; // 20 s per revolution
    progressRef.current = (progressRef.current + (delta / LOOP) * speed) % 1;

    const pathEl = pathRef.current;
    const carEl  = carRef.current;
    if (pathEl && carEl) {
      const len = pathEl.getTotalLength();
      const p   = progressRef.current;
      const pt  = pathEl.getPointAtLength(p * len);
      const ang = tangentAngle(pathEl, p);

      // Depth: near top (y≈68) → far, near bottom (y≈418) → close
      const dep   = Math.max(0, Math.min(1, (pt.y - 68) / 350));
      const scale = 0.58 + 0.42 * dep;
      const alpha = 0.28 + 0.72 * dep;

      carEl.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(${scale})`
      );
      carEl.style.opacity = alpha;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  /* loop start/stop is handled inside the scroll-event useEffect above */

  /* ── Render ────────────────────────────────────────────── */
  return (
    <motion.section
      ref={sectionRef}
      id="route-globe"
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden bg-noir py-20 lg:py-28"
    >
      {/* Decorative gradient overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champ/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-champ/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_68%_50%,rgba(169,130,63,0.07)_0%,transparent_70%)]" />
      </div>

      <div className="wrap relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-10">

          {/* ── Left: text ─────────────────────────────── */}
          <div>
            <span className="eyebrow mb-5 inline-flex text-champ-lt">
              Global Chauffeur Network
            </span>
            <h2 className="max-w-[18ch] text-[clamp(1.9rem,4.2vw,3.1rem)] leading-[1.08] text-cream">
              {headline}
            </h2>
            <p className="mt-5 max-w-[32ch] text-[1.02rem] leading-relaxed text-cream/55">
              {subline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.button
                onClick={onCta}
                whileHover={{ scale: 1.035 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-full border border-champ/60 bg-champ/12 px-8 py-3.5 text-[0.88rem] font-semibold tracking-wide text-champ-lt transition-colors hover:bg-champ/22"
              >
                {ctaText}
              </motion.button>
              <span className="text-[0.78rem] text-cream/35">
                5 cities · 24 / 7
              </span>
            </div>

            {/* City list */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5" aria-label="Service cities">
              {CITIES.map(c => (
                <li key={c.label} className="flex items-center gap-2 text-[0.76rem] font-medium text-cream/45">
                  <span className="h-[5px] w-[5px] rounded-full bg-champ" aria-hidden="true" />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: animated globe ──────────────────── */}
          <div
            className="relative mx-auto w-full max-w-[480px]"
            onMouseEnter={() => { hoverRef.current = true; }}
            onMouseLeave={() => { hoverRef.current = false; setTooltip(null); }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VB} ${VB}`}
              width="100%"
              aria-hidden="true"
              style={{ display: "block", overflow: "visible" }}
            >
              <defs>
                {/* Globe background */}
                <radialGradient id="rg-bg" cx="38%" cy="32%" r="75%">
                  <stop offset="0%"   stopColor="#201d14" />
                  <stop offset="55%"  stopColor="#131109" />
                  <stop offset="100%" stopColor="#090806" />
                </radialGradient>

                {/* Atmosphere rim */}
                <radialGradient id="rg-atm" cx="50%" cy="50%" r="52%">
                  <stop offset="78%" stopColor="transparent" />
                  <stop offset="100%" stopColor="rgba(169,130,63,0.2)" />
                </radialGradient>

                {/* Route glow */}
                <filter id="rg-rg" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Car glow */}
                <filter id="rg-cg" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
                  <feFlood floodColor="#A9823F" floodOpacity="0.45" result="c" />
                  <feComposite in="c" in2="b" operator="in" result="g" />
                  <feMerge>
                    <feMergeNode in="g" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Pin glow */}
                <filter id="rg-pg">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Clip to globe circle */}
                <clipPath id="rg-clip">
                  <circle cx={CX} cy={CY} r={R} />
                </clipPath>
              </defs>

              {/* ── Globe sphere ──────────────────── */}
              <circle cx={CX} cy={CY} r={R} fill="url(#rg-bg)" />

              {/* ── Latitude / longitude grid ─────── */}
              <g
                clipPath="url(#rg-clip)"
                fill="none"
                stroke="#C9A86A"
                strokeOpacity="0.09"
                strokeWidth="0.65"
              >
                {/* Latitude (horizontal ellipses) */}
                <ellipse cx={CX} cy={CY}       rx={R}    ry="24" />
                <ellipse cx={CX} cy={CY - 88}  rx="166"  ry="21" />
                <ellipse cx={CX} cy={CY + 88}  rx="166"  ry="21" />
                <ellipse cx={CX} cy={CY - 152} rx="96"   ry="13" />
                <ellipse cx={CX} cy={CY + 152} rx="96"   ry="13" />
                {/* Longitude (vertical ellipses) */}
                <ellipse cx={CX} cy={CY} rx="42"  ry={R} />
                <ellipse cx={CX} cy={CY} rx="96"  ry={R} />
                <ellipse cx={CX} cy={CY} rx="160" ry={R} />
              </g>

              {/* ── Atmosphere glow ───────────────── */}
              <circle cx={CX} cy={CY} r={R + 2} fill="url(#rg-atm)" />

              {/* ── Globe border ──────────────────── */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="#C9A86A"
                strokeOpacity="0.2"
                strokeWidth="1"
              />

              {/* ── Floating particles ────────────── */}
              {[
                [55, 115, 0], [428, 88, 1], [75, 392, 2], [445, 408, 3],
                [22, 248, 0], [478, 252, 1], [195, 38, 2], [315, 464, 3],
                [148, 64, 0], [372, 438, 1], [488, 158, 2], [20, 344, 3],
                [460, 320, 0], [40, 180, 1],
              ].map(([px, py, d], i) => (
                <circle
                  key={i}
                  cx={px} cy={py} r="1.3"
                  fill="#C9A86A"
                  className={`rg-particle rg-p${d}`}
                  style={{ opacity: 0.12 + (i % 4) * 0.07 }}
                />
              ))}

              {/* ── Route path (reference, invisible) ── */}
              <path ref={pathRef} d={ROUTE} fill="none" stroke="none" />

              {/* ── Route path (visible gold dashes) ─── */}
              <path
                d={ROUTE}
                fill="none"
                stroke="#C9A86A"
                strokeWidth="1.25"
                strokeDasharray="7 5"
                strokeOpacity="0.55"
                filter="url(#rg-rg)"
                className="rg-route"
              />

              {/* ── City pins ─────────────────────────── */}
              {pins.map((pin, i) => (
                <g
                  key={pin.label}
                  transform={`translate(${pin.x} ${pin.y})`}
                  onMouseEnter={() => setTooltip(pin)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "default" }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx="0" cy="0" r="5"
                    fill="none"
                    stroke="#C9A86A"
                    strokeOpacity="0.55"
                    className={`rg-pin-ring rg-d${i % 3}`}
                  />
                  {/* Static dot */}
                  <circle cx="0" cy="0" r="4" fill="#A9823F" opacity="0.8" filter="url(#rg-pg)" />
                  <circle cx="0" cy="0" r="2.2" fill="#E8C97C" />
                </g>
              ))}

              {/* ── Vehicle ───────────────────────────── */}
              {/* Car group — position updated by rAF */}
              <g ref={carRef} filter="url(#rg-cg)">
                {/* Ground shadow ellipse */}
                <ellipse cx="0" cy="30" rx="38" ry="8" fill="rgba(0,0,0,0.35)" />
                {/*
                  TODO: Replace with actual AFSAHI fleet PNG if you swap the image.
                  Current: Mercedes E-Class — /images/cars/1.png
                  The image uses preserveAspectRatio="xMidYMid meet".
                  If the PNG background is not transparent, wrap in a dark rect.
                */}
                <image
                  href={carImage}
                  x="-52" y="-30"
                  width="104" height="62"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ imageRendering: "auto" }}
                />
              </g>
            </svg>

            {/* ── City tooltip ────────────────────── */}
            {tooltip && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
                style={{
                  left:      `${(tooltip.x / VB) * 100}%`,
                  top:       `${(tooltip.y / VB) * 100}%`,
                  marginTop: "-14px",
                }}
              >
                <div className="rounded-lg border border-champ/50 bg-noir/95 px-3.5 py-1.5 text-[0.72rem] font-semibold text-champ-lt shadow-xl backdrop-blur-sm">
                  {tooltip.label}
                  <div className="mt-0.5 text-[0.62rem] font-normal text-cream/50">
                    Chauffeur available
                  </div>
                </div>
                <div className="mx-auto mt-1 h-1.5 w-1.5 rotate-45 border-b border-r border-champ/50 bg-noir/95" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CSS Animations ─────────────────────────────── */}
      <style>{`
        /* Route flowing dashes */
        .rg-route {
          stroke-dashoffset: 220;
          animation: rg-flow 4.5s linear infinite;
        }
        @keyframes rg-flow {
          to { stroke-dashoffset: 0; }
        }

        /* City pin pulse rings */
        .rg-pin-ring {
          animation: rg-pulse 2.6s ease-out infinite;
        }
        .rg-d0 { animation-delay: 0s; }
        .rg-d1 { animation-delay: 0.87s; }
        .rg-d2 { animation-delay: 1.74s; }
        @keyframes rg-pulse {
          0%   { r: 5;  opacity: 0.7; }
          100% { r: 18; opacity: 0; }
        }

        /* Floating particles */
        .rg-particle {
          animation: rg-float 7s ease-in-out infinite;
        }
        .rg-p0 { animation-delay: 0s; }
        .rg-p1 { animation-delay: 1.75s; }
        .rg-p2 { animation-delay: 3.5s; }
        .rg-p3 { animation-delay: 5.25s; }
        @keyframes rg-float {
          0%, 100% { transform: translateY(0px);   opacity: 0.18; }
          50%       { transform: translateY(-4px);  opacity: 0.38; }
        }

        /* Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .rg-route,
          .rg-pin-ring,
          .rg-particle {
            animation: none !important;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </motion.section>
  );
}
