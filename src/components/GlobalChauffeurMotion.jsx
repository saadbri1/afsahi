import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// "Luxury Chauffeur Across Morocco" — premium Morocco route-network animation.
//
// Pure SVG + CSS (transform/opacity only) — no rAF, no per-frame JS, no map
// library. All keyframe math (bezier sampling for the touring car + its
// arrival pulse) runs ONCE at module load, not per frame; the browser's
// compositor drives every moving piece for free. City/airport labels use
// Framer Motion only for their one-time fade-in (as instructed). A single
// media query disables the continuous animations on mobile and under
// prefers-reduced-motion — every element already carries a correct static
// position, so the "paused" state is simply a clean, complete frame.
// ─────────────────────────────────────────────────────────────────────────────

const VB_W = 480, VB_H = 420;

const CITIES = [
  { code: "TNG", label: "Tanger",     x: 195, y: 60  },
  { code: "RBA", label: "Rabat",      x: 205, y: 155 },
  { code: "CMN", label: "Casablanca", x: 215, y: 205 },
  { code: "FEZ", label: "Fès",        x: 330, y: 110 },
  { code: "RAK", label: "Marrakech",  x: 350, y: 290 },
  { code: "AGA", label: "Agadir",     x: 255, y: 365 },
];

// Static background routes (indices into CITIES) — drawn once on reveal.
const ROUTES = [
  [0, 1], // Tanger–Rabat
  [1, 2], // Rabat–Casablanca
  [2, 3], // Casablanca–Fès
  [2, 4], // Casablanca–Marrakech
  [4, 5], // Marrakech–Agadir
];

// The car's touring path — a walk across all 6 cities using the routes above
// (Casablanca is the hub, so the tour passes through it twice, exactly like a
// real transfer network). `animation-direction: alternate` then plays the
// same walk backwards for a continuous, symmetric loop.
const TOUR = [0, 1, 2, 3, 2, 4, 5]; // Tanger→Rabat→Casablanca→Fès→Casablanca→Marrakech→Agadir
const TOUR_CONTROLS = [
  { x: 215, y: 100 }, // Tanger→Rabat
  { x: 225, y: 175 }, // Rabat→Casablanca
  { x: 300, y: 130 }, // Casablanca→Fès
  { x: 300, y: 130 }, // Fès→Casablanca (same road, reverse direction)
  { x: 300, y: 225 }, // Casablanca→Marrakech
  { x: 290, y: 345 }, // Marrakech→Agadir
];
const TOUR_DURATION = 36; // seconds, one-way (alternate mirrors the return trip)
const HOLD_PCT = 3;       // % of the timeline spent resting at each city

// Simplified, stylized Morocco outline — an evocative backdrop, not geo-data.
const MOROCCO_PATH =
  "M150,25 Q250,15 310,45 Q380,70 400,110 Q410,180 395,250 " +
  "Q380,320 340,375 Q300,400 245,405 Q200,398 175,362 " +
  "Q150,300 145,230 Q140,150 145,90 Q147,55 150,25 Z";

function bezierPoint(p0, c, p1, t) {
  const mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x, y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y };
}
function bezierAngle(p0, c, p1, t) {
  const mt = 1 - t;
  const dx = 2 * mt * (c.x - p0.x) + 2 * t * (p1.x - c.x);
  const dy = 2 * mt * (c.y - p0.y) + 2 * t * (p1.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// ── Build the tour timeline ONCE at module load (plain math, zero runtime cost) ─
function buildTimeline() {
  const legs = TOUR.length - 1;
  const holds = TOUR.length;
  const travelPct = (100 - HOLD_PCT * holds) / legs;
  let cursor = 0;
  const holdWindows = [];
  const legWindows = [];
  TOUR.forEach((cityIdx, i) => {
    const start = cursor, end = cursor + HOLD_PCT;
    holdWindows.push({ cityIdx, start, end });
    cursor = end;
    if (i < legs) {
      const ls = cursor, le = cursor + travelPct;
      legWindows.push({ from: TOUR[i], to: TOUR[i + 1], control: TOUR_CONTROLS[i], start: ls, end: le });
      cursor = le;
    }
  });
  return { holdWindows, legWindows };
}
const TIMELINE = buildTimeline();

function buildMarkerKeyframes({ holdWindows, legWindows }) {
  const stops = [];
  const push = (pct, x, y, a) => stops.push({ pct, text: `${pct.toFixed(2)}% { transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(1)}deg); }` });

  holdWindows.forEach((h, i) => {
    const incoming = legWindows[i - 1];
    const outgoing = legWindows[i];
    const city = CITIES[h.cityIdx];
    const angle = incoming
      ? bezierAngle(CITIES[incoming.from], incoming.control, CITIES[incoming.to], 1)
      : bezierAngle(CITIES[outgoing.from], outgoing.control, CITIES[outgoing.to], 0);
    push(h.start, city.x, city.y, angle);
    push(h.end, city.x, city.y, angle);
  });

  legWindows.forEach((leg) => {
    const p0 = CITIES[leg.from], p1 = CITIES[leg.to];
    const span = leg.end - leg.start;
    [0.25, 0.5, 0.75].forEach((t) => {
      const p = bezierPoint(p0, leg.control, p1, t);
      const a = bezierAngle(p0, leg.control, p1, t);
      push(leg.start + span * t, p.x, p.y, a);
    });
  });

  return stops.sort((a, b) => a.pct - b.pct).map((s) => s.text).join(" ");
}

// Arrival "ping" ring — a child of the marker, so it always sits exactly at
// the car's current position for free. Only its own scale/opacity animate.
function buildRingKeyframes({ holdWindows }) {
  const EPS = 0.15;
  const stops = [];
  const push = (pct, scale, opacity) => stops.push({ pct, text: `${pct.toFixed(2)}% { transform: scale(${scale}); opacity: ${opacity}; }` });
  push(0, 0.6, 0);
  holdWindows.forEach((h) => {
    const mid = h.start + (h.end - h.start) * 0.45;
    push(Math.max(0, h.start - EPS), 0.6, 0);
    push(h.start, 0.9, 0.55);
    push(mid, 1.7, 0.28);
    push(h.end, 2.5, 0);
    push(Math.min(100, h.end + EPS), 0.6, 0);
  });
  push(100, 0.6, 0);
  return stops.sort((a, b) => a.pct - b.pct).map((s) => s.text).join(" ");
}

const MARKER_KEYFRAMES = buildMarkerKeyframes(TIMELINE);
const RING_KEYFRAMES = buildRingKeyframes(TIMELINE);

const SCENE_CSS = `
  @keyframes gcm-marker { ${MARKER_KEYFRAMES} }
  @keyframes gcm-ring { ${RING_KEYFRAMES} }
  @keyframes gcm-citypulse { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.18); } }

  .gcm-marker { animation: gcm-marker ${TOUR_DURATION}s cubic-bezier(.45,0,.55,1) infinite alternate; transform-box: fill-box; transform-origin: center; }
  .gcm-ring { animation: gcm-ring ${TOUR_DURATION}s linear infinite alternate; transform-box: fill-box; transform-origin: center; }
  .gcm-city-ring { animation: gcm-citypulse 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

  @media (max-width: 640px), (prefers-reduced-motion: reduce) {
    .gcm-marker, .gcm-ring, .gcm-city-ring { animation: none !important; }
  }
`;

export default function GlobalChauffeurMotion({ onSeePrices }) {
  const sectionRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion();
  const isRevealed = revealed || !!reduce;

  // Scroll-driven reveal — Lenis scrolls html.scrollTop while body.scrollTop
  // stays 0, so IntersectionObserver / whileInView never fires; a plain
  // scroll listener + getBoundingClientRect is this site's proven pattern.
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
      className="relative overflow-hidden py-14 md:py-20"
      style={{ background: "radial-gradient(ellipse at 50% 55%, #0d1a2e 0%, #16130D 65%)" }}
      initial={{ opacity: 0, y: 48 }}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <style>{SCENE_CSS}</style>

      {/* Heading — unchanged */}
      <div className="relative z-10 text-center mb-8 px-4">
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

      {/* Route network scene — larger, fills the section */}
      <div
        className="relative mx-auto select-none"
        style={{ width: 720, maxWidth: "92vw", aspectRatio: `${VB_W} / ${VB_H}` }}
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

          {/* Subtle Morocco silhouette backdrop */}
          <path d={MOROCCO_PATH} fill="#1e3a6e" fillOpacity="0.10" stroke="#A9823F" strokeWidth="1" strokeOpacity="0.16" />

          {/* Gold route lines — draw softly on scroll reveal */}
          <g>
            {ROUTES.map(([a, b], i) => {
              const A = CITIES[a], B = CITIES[b];
              const len = Math.hypot(B.x - A.x, B.y - A.y);
              return (
                <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke="#A9823F" strokeWidth="1.1" strokeOpacity="0.45" strokeLinecap="round"
                  style={{
                    strokeDasharray: len,
                    strokeDashoffset: reduce || isRevealed ? 0 : len,
                    transition: reduce ? "none" : `stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1) ${0.15 + i * 0.14}s`,
                  }}
                />
              );
            })}
          </g>

          {/* City points */}
          {CITIES.map((c, i) => (
            <g key={i} transform={`translate(${c.x}, ${c.y})`}>
              <circle className="gcm-city-ring" r="9" fill="none" stroke="#A9823F" strokeWidth="1" strokeOpacity="0.45" />
              <circle r="3.2" fill="#C9A86A" />
              <circle r="3.2" fill="none" stroke="#A9823F" strokeWidth="0.6" strokeOpacity="0.8" />
            </g>
          ))}

          {/* Touring vehicle marker + arrival pulse ring */}
          <g className="gcm-marker" transform={`translate(${CITIES[TOUR[0]].x} ${CITIES[TOUR[0]].y})`}>
            <circle className="gcm-ring" r="6" fill="none" stroke="#C9A86A" strokeWidth="1" opacity="0" />
            <ellipse cx="0" cy="0" rx="9" ry="3.6" fill="#7E6024" opacity="0.35" />
            <ellipse cx="0" cy="0" rx="6.5" ry="2.6" fill="#C9A86A" />
            <ellipse cx="0" cy="0" rx="6.5" ry="2.6" fill="none" stroke="#A9823F" strokeWidth="0.6" />
          </g>
        </svg>

        {/* Airport code labels — Framer Motion fade-in only */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0, y: 8 }}
          animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {CITIES.map((c, i) => (
            <div key={i}
              className="absolute flex items-center gap-1"
              style={{ left: `${(c.x / VB_W) * 100}%`, top: `${(c.y / VB_H) * 100}%`, transform: "translate(10px, 8px)" }}
            >
              <Plane size={10} strokeWidth={1.8} className="text-champ-lt shrink-0" />
              <span className="text-[0.62rem] font-semibold tracking-[0.08em] text-cream/70 whitespace-nowrap">
                {c.code}
                <span className="hidden sm:inline text-cream/40 font-normal"> · {c.label}</span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA — unchanged */}
      <motion.div
        className="text-center mt-7 px-4"
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
