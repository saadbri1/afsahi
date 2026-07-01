/* "Expect more, notice less." — stagger-reveal feature grid */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShieldCheck, Clock, Car, Tag } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

const ICONS = [ShieldCheck, Clock, Car, Tag];

export default function WhyAfsahi() {
  const { t } = useLang();
  const w = t.why;
  const gridRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-tile]",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, stagger: 0.11, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 72%" } }
      );
    }, gridRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section className="section bg-paper">
      <div className="wrap">
        <div className="mb-14 text-center">
          <span className="eyebrow eyebrow--center mb-4 inline-flex">{w.kicker}</span>
          <h2 className="text-[clamp(2.4rem,5vw,4rem)]">{w.title}</h2>
          <p className="mx-auto mt-4 max-w-[36rem] text-[1.05rem] text-body">{w.sub}</p>
        </div>
        <div ref={gridRef} className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {w.points.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <article key={i} data-tile className="flex flex-col gap-4 bg-paper p-9 transition-colors duration-300 hover:bg-sand">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-champ">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="text-[1.15rem] font-semibold text-ink">{p.t}</h3>
                <p className="text-[0.92rem] leading-relaxed text-body">{p.d}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
