import { IMAGES } from "../data/images.js";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { scrollToHash } from "../hooks/useLenis.js";

const IMG = [IMAGES.serviceAirport, IMAGES.serviceHourly];
// Portrait sources in a 16/10 frame — keep each subject visible via object-position.
const IMG_POS = ["50% 42%", "50% 46%"];

export default function ServiceCards() {
  const { t } = useLang();
  const s = t.services;
  const headRef = useScrollReveal({ childSelector: "[data-reveal-child]" });
  const gridRef = useScrollReveal({ childSelector: "[data-reveal-child]" });

  return (
    <section id="services" className="section bg-sand">
      <div ref={headRef} className="wrap mb-12 text-center">
        <span data-reveal-child className="eyebrow eyebrow--center mb-4 inline-flex">{s.kicker}</span>
        <h2 data-reveal-child className="text-[clamp(2.4rem,5vw,4rem)]">{s.title}</h2>
        <p data-reveal-child className="mx-auto mt-4 max-w-[34rem] text-[1.05rem] text-body">{s.sub}</p>
      </div>

      <div ref={gridRef} className="wrap grid gap-6 md:grid-cols-2">
        {s.cards.map((c, i) => (
          <article key={i} data-reveal-child
            className="group overflow-hidden rounded-3xl border border-line bg-surface transition-all duration-500 ease-luxe hover:-translate-y-1 hover:shadow-[0_30px_60px_-34px_rgba(21,18,12,0.35)]">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={IMG[i]} alt={c.title} style={{ objectPosition: IMG_POS[i] }} className="h-full w-full object-cover transition-transform duration-[1100ms] ease-luxe group-hover:scale-[1.05]" />
            </div>
            <div className="p-8">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-champ-dk">{c.label}</span>
              <h3 className="mt-3 text-[1.7rem]">{c.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[0.96rem] text-body">{c.body}</p>
              <button onClick={() => scrollToHash("#book")} data-cursor
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[0.78rem] font-semibold text-ink transition-all duration-300 hover:border-champ hover:text-champ-dk">
                {c.cta}
                <span className="transition-transform duration-500 ease-luxe group-hover:translate-x-1">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
