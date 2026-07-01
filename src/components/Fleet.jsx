/* "Choose your experience." — horizontal scroll fleet carousel */
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase } from "lucide-react";
import { FLEET } from "../data/fleet.js";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

const CLASS_LABELS = ["Business Class", "First Class", "Premium SUV", "Premium Sedan", "Economy Sedan", "Business Van", "Executive Van", "VIP Minibus", "Premium Shuttle"];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

export default function Fleet() {
  const { t } = useLang();
  const f = t.fleet;
  const headRef = useScrollReveal({ childSelector: "[data-fl-child]" });
  const trackRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  // Framer Motion can't use whileInView here because Lenis scrolls html.scrollTop
  // while body.scrollTop stays 0, so IO never fires. We drive visibility via a
  // native scroll listener (which reads html.scrollTop correctly through getBCR).
  const [visible, setVisible] = useState(() => new Array(FLEET.length).fill(false));

  useEffect(() => {
    if (reduce || !trackRef.current) return;
    const cards = [...trackRef.current.querySelectorAll("article")];
    if (!cards.length) return;

    const revealed = new Set();

    const check = () => {
      const vh = window.innerHeight;
      cards.forEach((card, idx) => {
        if (revealed.has(idx)) return;
        if (card.getBoundingClientRect().top < vh * 0.88) {
          revealed.add(idx);
          setVisible(prev => { const n = [...prev]; n[idx] = true; return n; });
        }
      });
      if (revealed.size === cards.length) window.removeEventListener("scroll", check);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [reduce]);

  return (
    <section id="fleet" className="section overflow-hidden bg-paper">
      <div className="wrap mb-12">
        <div ref={headRef} className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span data-fl-child className="eyebrow mb-4 inline-flex">{f.kicker}</span>
            <h2 data-fl-child className="text-[clamp(2.4rem,5vw,4rem)]">{f.title}</h2>
            <p data-fl-child className="mt-3 max-w-[36rem] text-[1.05rem] text-body">{f.sub}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button onClick={() => trackRef.current.scrollBy({ left: -360, behavior: "smooth" })}
              aria-label="Previous"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-all hover:border-ink hover:bg-sand">
              ←
            </button>
            <button onClick={() => trackRef.current.scrollBy({ left: 360, behavior: "smooth" })}
              aria-label="Next"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-all hover:border-ink hover:bg-sand">
              →
            </button>
          </div>
        </div>
      </div>

      <div ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-8 pl-[max(2rem,calc((100vw-80rem)/2))] pr-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FLEET.map((vehicle, i) => (
          <motion.article
            key={vehicle.id}
            variants={CARD_VARIANTS}
            initial="hidden"
            animate={visible[i] ? "show" : "hidden"}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
              delay: visible[i] ? i * 0.08 : 0,
            }}
            whileHover={reduce ? {} : {
              y: -6,
              scale: 1.015,
              transition: { type: "spring", stiffness: 260, damping: 20, delay: 0 },
            }}
            className="group flex-none snap-start w-[clamp(260px,30vw,320px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_2px_16px_-6px_rgba(21,18,12,0.10)] hover:border-champ/50 hover:shadow-[0_28px_52px_-18px_rgba(21,18,12,0.22),0_0_0_1px_rgba(169,130,63,0.28)] transition-[border-color,box-shadow] duration-300 cursor-pointer"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-t-2xl"
              style={{ background: "radial-gradient(ellipse at 58% 62%, #fffaf2 0%, #ede3d0 44%, #e0d4c0 100%)" }}>
              <img src={vehicle.img} alt={vehicle.name} draggable={false}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-[900ms] ease-luxe group-hover:scale-[1.04]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%]"
                style={{ background: "linear-gradient(to top, #ede3d0 0%, transparent 100%)" }} />
            </div>
            <div className="p-7">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-champ-dk">
                {CLASS_LABELS[i] ?? vehicle.name}
              </span>
              <h3 className="mt-2 text-[1.25rem] font-semibold text-ink">{vehicle.name}</h3>
              <div className="mt-4 flex items-center gap-5 text-[0.82rem] text-muted">
                <span className="flex items-center gap-1.5"><Users size={14} strokeWidth={1.7} />{vehicle.pax} {f.pax}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} strokeWidth={1.7} />{vehicle.bags} {f.bags}</span>
              </div>
              <div className="mt-6 border-t border-line pt-5">
                <a href="#book"
                  className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-ink transition-colors hover:text-champ-dk">
                  Book this class <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
