import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

const lerp = (a, b, t) => a + (b - a) * t;

const CX = 250, CY = 250;
const A_ORB = 185, B_ORB = 65;
const R_GLOBE = 155;
const CARD_W = 82, CARD_H = 104;
const BASE_SPEED = 0.00052;

const VEHICLES = [
  { img: "/images/cars/1.png", label: "Executive Sedan", speed: 1.00, phase: 0 },
  { img: "/images/cars/2.png", label: "Executive Van",   speed: 0.78, phase: 2.094 },
  { img: "/images/cars/8.png", label: "VIP Minibus",     speed: 0.91, phase: 4.189 },
];

const LAT_F   = [-0.75, -0.4, 0.4, 0.75];
const LON_RX  = [52, 108];
const CITIES  = [[228, 238], [234, 220], [225, 206], [241, 265]];
const STATIC_ANGLES = [Math.PI * 0.28, Math.PI * 0.55, Math.PI * 0.82];

export default function GlobalChauffeurMotion({ onSeePrices }) {
  const sectionRef = useRef(null);
  const bCarRefs   = useRef([]);
  const fCarRefs   = useRef([]);
  const bShdRefs   = useRef([]);
  const fShdRefs   = useRef([]);
  const rafRef     = useRef(null);
  const runRef     = useRef(false);
  const lastTs     = useRef(null);
  const angles     = useRef(VEHICLES.map(v => v.phase));
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion();
  const isRevealed = revealed || !!reduce;

  const tick = useCallback((ts) => {
    if (!runRef.current) return;
    const dt = lastTs.current == null ? 0 : Math.min(ts - lastTs.current, 50);
    lastTs.current = ts;

    VEHICLES.forEach((v, i) => {
      angles.current[i] += BASE_SPEED * v.speed * dt;
      const θ = angles.current[i];
      const x = CX + A_ORB * Math.cos(θ);
      const y = CY + B_ORB * Math.sin(θ);
      const depth = (Math.sin(θ) + 1) / 2;
      const sc    = lerp(0.50, 1.15, depth);
      const al    = lerp(0.38, 1.00, depth);
      const front = Math.sin(θ) >= 0;

      const tx  = (x - CARD_W * sc / 2).toFixed(2);
      const ty  = (y - CARD_H * sc / 2).toFixed(2);
      const tf  = `translate(${tx},${ty}) scale(${sc.toFixed(4)})`;
      const shY = (y + CARD_H * sc / 2 + 2 * sc).toFixed(2);
      const shRx = Math.max(16, CARD_W * sc * 0.5 * (0.3 + 0.7 * depth));
      const shRy = Math.max(3,   6  * sc * depth);
      const shO  = (0.4 * depth).toFixed(3);

      const bc = bCarRefs.current[i];
      if (bc) { bc.setAttribute("transform", tf); bc.style.opacity = front ? "0" : al; }
      const bs = bShdRefs.current[i];
      if (bs) {
        bs.setAttribute("cx", x.toFixed(2));
        bs.setAttribute("cy", shY);
        bs.setAttribute("rx", shRx.toFixed(2));
        bs.setAttribute("ry", shRy.toFixed(2));
        bs.style.opacity = front ? "0" : shO;
      }

      const fc = fCarRefs.current[i];
      if (fc) { fc.setAttribute("transform", tf); fc.style.opacity = front ? al : "0"; }
      const fs = fShdRefs.current[i];
      if (fs) {
        fs.setAttribute("cx", x.toFixed(2));
        fs.setAttribute("cy", shY);
        fs.setAttribute("rx", shRx.toFixed(2));
        fs.setAttribute("ry", shRy.toFixed(2));
        fs.style.opacity = front ? shO : "0";
      }
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const el = sectionRef.current;
    if (!el) return;
    const check = () => {
      const { top, bottom } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vis = bottom > -120 && top < vh + 120;
      if (vis) setRevealed(true);
      if (vis && !runRef.current) {
        runRef.current = true; lastTs.current = null;
        rafRef.current = requestAnimationFrame(tick);
      } else if (!vis && runRef.current) {
        runRef.current = false; cancelAnimationFrame(rafRef.current);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      runRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [reduce, tick]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: "radial-gradient(ellipse at 50% 55%, #0d1a2e 0%, #16130D 65%)" }}
      initial={{ opacity: 0, y: 48 }}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Heading */}
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

      {/* Globe scene */}
      <div
        className="relative mx-auto select-none"
        style={{ width: 500, maxWidth: "92vw", aspectRatio: "1 / 1" }}
      >
        <svg
          viewBox="0 0 500 500"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="gcm-gb" cx="38%" cy="32%" r="68%">
              <stop offset="0%"   stopColor="#1e3a6e" stopOpacity="0.88" />
              <stop offset="55%"  stopColor="#0b1a35" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#030b18" stopOpacity="1" />
            </radialGradient>
            <radialGradient id="gcm-hl" cx="32%" cy="26%" r="50%">
              <stop offset="0%"   stopColor="#fff" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gcm-rim" cx="50%" cy="50%" r="50%">
              <stop offset="82%"  stopColor="#A9823F" stopOpacity="0" />
              <stop offset="100%" stopColor="#A9823F" stopOpacity="0.22" />
            </radialGradient>
            <radialGradient id="gcm-cbg" cx="58%" cy="62%" r="70%">
              <stop offset="0%"   stopColor="#fffaf2" />
              <stop offset="44%"  stopColor="#ede3d0" />
              <stop offset="100%" stopColor="#e0d4c0" />
            </radialGradient>
            <linearGradient id="gcm-sw" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#A9823F" stopOpacity="0" />
              <stop offset="45%"  stopColor="#A9823F" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#A9823F" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="gcm-sh" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(169,130,63,0.22)" />
              <stop offset="55%"  stopColor="rgba(0,0,0,0.38)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <clipPath id="gcm-cc">
              <rect x="0" y="0" width={CARD_W} height={CARD_H} rx="8" ry="8" />
            </clipPath>
            <clipPath id="gcm-gc">
              <circle cx={CX} cy={CY} r={R_GLOBE - 1} />
            </clipPath>
            <filter id="gcm-df" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.65" />
            </filter>
            <filter id="gcm-gf" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#A9823F" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* === BACK LAYER — rendered before globe so cars pass behind it === */}
          {VEHICLES.map((_, i) => (
            <ellipse key={`bs${i}`}
              ref={el => (bShdRefs.current[i] = el)}
              cx={CX} cy={450} rx="16" ry="4"
              fill="url(#gcm-sh)" opacity="0"
            />
          ))}
          {VEHICLES.map((v, i) => (
            <g key={`bc${i}`} ref={el => (bCarRefs.current[i] = el)} opacity="0" filter="url(#gcm-df)">
              <g clipPath="url(#gcm-cc)">
                <rect width={CARD_W} height={CARD_H} fill="url(#gcm-cbg)" />
                <image href={v.img} width={CARD_W} height={CARD_H} preserveAspectRatio="xMidYMid meet" />
                <rect width={CARD_W} height={CARD_H} fill="url(#gcm-sw)" opacity="0.7" />
              </g>
              <rect width={CARD_W} height={CARD_H} rx="8" ry="8"
                fill="none" stroke="rgba(169,130,63,0.32)" strokeWidth="0.8" />
            </g>
          ))}

          {/* === GLOBE — middle layer === */}
          <circle cx={CX} cy={CY} r={R_GLOBE} fill="url(#gcm-gb)" />
          <g clipPath="url(#gcm-gc)">
            {LAT_F.map((f, i) => (
              <ellipse key={i}
                cx={CX} cy={CY + f * R_GLOBE}
                rx={Math.sqrt(1 - f * f) * R_GLOBE}
                ry={Math.sqrt(1 - f * f) * R_GLOBE * 0.35}
                fill="none" stroke="#2e4f82" strokeWidth="0.5" strokeOpacity="0.4"
              />
            ))}
            <ellipse cx={CX} cy={CY} rx={R_GLOBE} ry={R_GLOBE * 0.35}
              fill="none" stroke="#A9823F" strokeWidth="1.2" strokeOpacity="0.55" />
            {LON_RX.map((rx, i) => (
              <ellipse key={i} cx={CX} cy={CY} rx={rx} ry={R_GLOBE}
                fill="none" stroke="#2e4f82" strokeWidth="0.5" strokeOpacity="0.35" />
            ))}
            <line x1={CX} y1={CY - R_GLOBE} x2={CX} y2={CY + R_GLOBE}
              stroke="#2e4f82" strokeWidth="0.5" strokeOpacity="0.35" />
          </g>
          <circle cx={CX} cy={CY} r={R_GLOBE} fill="url(#gcm-hl)" />
          <circle cx={CX} cy={CY} r={R_GLOBE} fill="url(#gcm-rim)" />
          <circle cx={CX} cy={CY} r={R_GLOBE} fill="none"
            stroke="#A9823F" strokeWidth="0.7" strokeOpacity="0.2" />

          {/* Orbit track */}
          <ellipse cx={CX} cy={CY} rx={A_ORB} ry={B_ORB}
            fill="none" stroke="#A9823F" strokeWidth="0.5"
            strokeOpacity="0.15" strokeDasharray="4 9" />

          {/* Moroccan city pins */}
          {CITIES.map(([pcx, pcy], i) => (
            <g key={i}>
              <circle cx={pcx} cy={pcy} r={2.5} fill="#A9823F" opacity="0.85" />
              <circle cx={pcx} cy={pcy} r={5}
                fill="none" stroke="#A9823F" strokeWidth="0.6" strokeOpacity="0.4" />
            </g>
          ))}

          {/* === FRONT LAYER — rendered after globe so cars pass in front === */}
          {VEHICLES.map((_, i) => (
            <ellipse key={`fs${i}`}
              ref={el => (fShdRefs.current[i] = el)}
              cx={CX} cy={450} rx="16" ry="4"
              fill="url(#gcm-sh)" opacity="0"
            />
          ))}
          {VEHICLES.map((v, i) => (
            <g key={`fc${i}`} ref={el => (fCarRefs.current[i] = el)} opacity="0" filter="url(#gcm-gf)">
              <g clipPath="url(#gcm-cc)">
                <rect width={CARD_W} height={CARD_H} fill="url(#gcm-cbg)" />
                <image href={v.img} width={CARD_W} height={CARD_H} preserveAspectRatio="xMidYMid meet" />
                <rect width={CARD_W} height={CARD_H} fill="url(#gcm-sw)" opacity="0.7" />
              </g>
              <rect width={CARD_W} height={CARD_H} rx="8" ry="8"
                fill="none" stroke="rgba(169,130,63,0.45)" strokeWidth="1" />
            </g>
          ))}

          {/* === REDUCED MOTION: static parked cars (drawn on top) === */}
          {reduce && STATIC_ANGLES.map((θ, i) => {
            const v = VEHICLES[i];
            const x = CX + A_ORB * Math.cos(θ);
            const y = CY + B_ORB * Math.sin(θ);
            const depth = (Math.sin(θ) + 1) / 2;
            const sc = lerp(0.5, 1.15, depth);
            const al = lerp(0.38, 1, depth);
            const tx = x - CARD_W * sc / 2;
            const ty = y - CARD_H * sc / 2;
            return (
              <g key={`st${i}`}
                transform={`translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})`}
                opacity={al.toFixed(3)}
              >
                <g clipPath="url(#gcm-cc)">
                  <rect width={CARD_W} height={CARD_H} fill="url(#gcm-cbg)" />
                  <image href={v.img} width={CARD_W} height={CARD_H} preserveAspectRatio="xMidYMid meet" />
                </g>
                <rect width={CARD_W} height={CARD_H} rx="8" ry="8"
                  fill="none" stroke="rgba(169,130,63,0.4)" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* CTA */}
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
