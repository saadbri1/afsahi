/* "Choose your experience." — horizontal scroll fleet carousel */
import { useRef, useEffect, useState } from "react";
import { Users, Briefcase } from "lucide-react";
import { FLEET } from "../data/fleet.js";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const CLASS_LABELS = ["Business Class", "First Class", "Premium SUV", "Premium Sedan", "Economy Sedan", "Business Van", "Executive Van", "VIP Minibus", "Premium Shuttle"];

export default function Fleet() {
  const { t } = useLang();
  const f = t.fleet;
  const headRef = useScrollReveal({ childSelector: "[data-fl-child]" });
  const trackRef = useRef(null);

  const [visible, setVisible] = useState(() => new Array(FLEET.length).fill(false));

  useEffect(() => {
    if (!trackRef.current) return undefined;
    const cards = [...trackRef.current.querySelectorAll("article")];
    if (!cards.length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(new Array(FLEET.length).fill(true));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = cards.indexOf(entry.target);
        setVisible((previous) => {
          const next = [...previous];
          next[index] = true;
          return next;
        });
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 120px -8%", threshold: 0.12 });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

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
          <article
            key={vehicle.id}
            style={{ transitionDelay: visible[i] ? `${Math.min(i, 4) * 60}ms` : "0ms" }}
            className={`group flex-none snap-start w-[clamp(260px,30vw,320px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_2px_16px_-6px_rgba(21,18,12,0.10)] transition-[opacity,transform,border-color,box-shadow] duration-700 ease-luxe hover:-translate-y-1 hover:border-champ/50 hover:shadow-[0_28px_52px_-18px_rgba(21,18,12,0.22),0_0_0_1px_rgba(169,130,63,0.28)] ${visible[i] ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"}`}
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-t-2xl"
              style={{ background: "radial-gradient(ellipse at 58% 62%, #fffaf2 0%, #ede3d0 44%, #e0d4c0 100%)" }}>
              <img src={vehicle.img} alt={vehicle.name} draggable={false}
                width="672" height="900" loading="lazy" decoding="async"
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
          </article>
        ))}
      </div>
    </section>
  );
}
