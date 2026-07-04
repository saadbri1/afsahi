import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// "Luxury Chauffeur Across Morocco" — minimal gold route-network animation.
//
// Pure SVG + CSS (transform/opacity only) — no rAF, no per-frame JS. The
// keyframes for the travelling vehicle marker and the light-pulses are
// computed ONCE at module load (plain math, not a per-frame loop) and handed
// to the browser as static @keyframes text; the compositor then drives every
// moving piece for free. A single media query disables all of it on mobile
// and under prefers-reduced-motion — the same markup then simply reads as a
// clean, complete static frame (no separate "static" render path needed).
// ─────────────────────────────────────────────────────────────────────────────

const VB_W = 600, VB_H = 400;

const CITIES = [
  { label: "Tanger",     x: 150, y: 55  },
  { label: "Rabat",      x: 168, y: 140 },
  { label: "Casablanca", x: 178, y: 195 },
  { label: "Marrakech",  x: 330, y: 270 },
  { label: "Agadir",     x: 230, y: 335 },
];

// Network edges (indices into CITIES). Edge 2 (Casablanca–Marrakech) also
// carries the slow-moving vehicle marker.
const ROUTES = [
  [0, 1], // Tanger–Rabat
  [1, 2], // Rabat–Casablanca
  [2, 3], // Casablanca–Marrakech
  [3, 4], // Marrakech–Agadir
  [2, 4], // Casablanca–Agadir (cross-link)
];
const MARKER_ROUTE = 2;
const MARKER_CONTROL = { x: 254, y: 210 }; // bezier control point — gentle arc

function bezierPoint(p0, c, p1, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  };
}
function bezierAngle(p0, c, p1, t) {
  const mt = 1 - t;
  const dx = 2 * mt * (c.x - p0.x) + 2 * t * (p1.x - c.x);
  const dy = 2 * mt * (c.y - p0.y) + 2 * t * (p1.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ── Build all @keyframes ONCE at module load (plain math, zero runtime cost) ─
// Every element below gets its correct resting position from a plain SVG
// attribute (transform/cx/cy) FIRST; the CSS animation only ever overrides
// that value while it's actually running. That way, when the animation is
// switched off (mobile / prefers-reduced-motion), nothing collapses to the
// SVG origin — it simply sits, already correctly placed, as a static frame.
const markerFrom = CITIES[ROUTES[MARKER_ROUTE][0]];
const markerTo = CITIES[ROUTES[MARKER_ROUTE][1]];
const markerStartAngle = bezierAngle(markerFrom, MARKER_CONTROL, markerTo, 0).toFixed(1);
const MARKER_KEYFRAMES = [0, 0.2, 0.4, 0.6, 0.8, 1]
  .map((t) => {
    const p = bezierPoint(markerFrom, MARKER_CONTROL, markerTo, t);
    const a = bezierAngle(markerFrom, MARKER_CONTROL, markerTo, t);
    return `${(t * 100).toFixed(0)}% { transform: translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${a.toFixed(1)}deg); }`;
  })
  .join(" ");

// Flow-dot circles carry their own cx/cy = route start point (always correct,
// never depends on CSS); the animation only adds a RELATIVE delta on top.
const FLOW_KEYFRAMES = ROUTES.map(([a, b], i) => {
  const A = CITIES[a], B = CITIES[b];
  const dx = (B.x - A.x).toFixed(1), dy = (B.y - A.y).toFixed(1);
  return `@keyframes gcm-flow-${i} {
    0%   { transform: translate(0px, 0px); opacity: 0; }
    10%  { opacity: .85; }
    90%  { opacity: .85; }
    100% { transform: translate(${dx}px, ${dy}px); opacity: 0; }
  }`;
}).join("\n");

const FLOW_CLASSES = ROUTES
  .map((_, i) => `.gcm-flow-${i} { opacity: 0; animation: gcm-flow-${i} ${4 + i * 0.6}s linear infinite; animation-delay: ${(i * 0.7).toFixed(1)}s; transform-box: fill-box; transform-origin: center; }`)
  .join("\n");

const FLOW_SELECTORS = ROUTES.map((_, i) => `.gcm-flow-${i}`).join(", ");

const SCENE_CSS = `
  @keyframes gcm-marker { ${MARKER_KEYFRAMES} }
  @keyframes gcm-citypulse { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.18); } }
  @keyframes gcm-breathe { 0%, 100% { opacity: .32; } 50% { opacity: .52; } }
  ${FLOW_KEYFRAMES}

  .gcm-marker { animation: gcm-marker 11s cubic-bezier(.45,0,.55,1) infinite alternate; transform-box: fill-box; transform-origin: center; }
  .gcm-city-ring { animation: gcm-citypulse 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .gcm-lines { animation: gcm-breathe 8s ease-in-out infinite; }
  ${FLOW_CLASSES}

  @media (max-width: 640px), (prefers-reduced-motion: reduce) {
    .gcm-marker, .gcm-city-ring, .gcm-lines, ${FLOW_SELECTORS} { animation: none !important; }
  }
`;

export default function GlobalChauffeurMotion({ onSeePrices }) {
  const sectionRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion();
  const isRevealed = revealed || !!reduce;

  // Scroll-driven reveal for the heading/CTA — Lenis scrolls html.scrollTop
  // while body.scrollTop stays 0, so IntersectionObserver / whileInView never
  // fires; a plain scroll listener + getBoundingClientRect is the reliable
  // Lenis-compatible pattern used across this site.
  useEffect(() => {
    if (reduce) return;
    const el = sectionRef.current;
    if (!el) return;
    const check = () => {
      const { top, bottom } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (bottom > -120 && top < vh + 120) setRevealed(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [reduce]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: "radial-gradient(ellipse at 50% 55%, #0d1a2e 0%, #16130D 65%)" }}
      initial={{ opacity: 0, y: 48 }}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <style>{SCENE_CSS}</style>

      {/* Heading — unchanged */}
      <div className="relative z-10 text-center mb-12 px-4">
        <motion.p
          className="text-champ text-xs tracking-[0.28em] uppercase mb-3 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.55, delay: 0.2 }}
        >
          Worldwide Service
        </motion.p>
        <motion.h2
          className="text-cream text-3xl sm:text-4xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 14 }}
          animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Luxury Chauffeur Across Morocco
        </motion.h2>
        <motion.p
          className="text-muted mt-3 max-w-md mx-auto text-sm leading-relaxed"
          initial={{ opacity: 0, y: 14 }}
          animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Premium airport transfers, intercity travel and executive chauffeur
          service with comfort, privacy and precision.
        </motion.p>
      </div>

      {/* Route network scene */}
      <div
        className="relative mx-auto select-none"
        style={{ width: 640, maxWidth: "92vw", aspectRatio: `${VB_W} / ${VB_H}` }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="gcm-vign" cx="50%" cy="46%" r="65%">
              <stop offset="0%" stopColor="#1e3a6e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1e3a6e" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#gcm-vign)" />

          {/* Gold route network — soft ambient breathing */}
          <g className="gcm-lines">
            {ROUTES.map(([a, b], i) => {
              const A = CITIES[a], B = CITIES[b];
              return (
                <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke="#A9823F" strokeWidth="1" strokeOpacity="0.4"
                  strokeDasharray="2 6" strokeLinecap="round" />
              );
            })}
          </g>

          {/* Travelling light pulses along each route — cx/cy = route start
              point, so they sit correctly even when the animation is off */}
          {ROUTES.map(([a], i) => (
            <circle key={i} className={`gcm-flow-${i}`} cx={CITIES[a].x} cy={CITIES[a].y} r="2.6" fill="#C9A86A" />
          ))}

          {/* City points */}
          {CITIES.map((c, i) => (
            <g key={i} transform={`translate(${c.x}, ${c.y})`}>
              <circle className="gcm-city-ring" r="9" fill="none"
                stroke="#A9823F" strokeWidth="1" strokeOpacity="0.45" />
              <circle r="3" fill="#C9A86A" />
              <circle r="3" fill="none" stroke="#A9823F" strokeWidth="0.6" strokeOpacity="0.8" />
            </g>
          ))}

          {/* Slow vehicle marker travelling the Casablanca–Marrakech route.
              The transform ATTRIBUTE is its resting pose — the CSS animation
              overrides it only while actually running (desktop, motion OK). */}
          <g className="gcm-marker" transform={`translate(${markerFrom.x} ${markerFrom.y}) rotate(${markerStartAngle})`}>
            <ellipse cx="0" cy="0" rx="9" ry="3.6" fill="#7E6024" opacity="0.35" />
            <ellipse cx="0" cy="0" rx="6.5" ry="2.6" fill="#C9A86A" />
            <ellipse cx="0" cy="0" rx="6.5" ry="2.6" fill="none" stroke="#A9823F" strokeWidth="0.6" />
          </g>
        </svg>
      </div>

      {/* CTA — unchanged */}
      <motion.div
        className="text-center mt-10 px-4"
        initial={{ opacity: 0, y: 14 }}
        animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.6, delay: 0.55 }}
      >
        <motion.button
          onClick={onSeePrices}
          className="inline-flex items-center gap-2 bg-champ text-ink text-xs font-bold tracking-[0.16em] uppercase px-8 py-3.5 rounded-full"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          Book Your Ride
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
