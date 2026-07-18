/* "All of Morocco, between two doors." — city tile grid */
import { ArrowRight } from "lucide-react";
import { CITIES } from "../data/cities.js";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

export default function ServiceAreas() {
  const { t } = useLang();
  const a = t.areas;
  const headRef = useScrollReveal({ childSelector: "[data-a-child]" });
  const gridRef = useScrollReveal({ childSelector: "[data-city]" });

  return (
    <section id="cities" className="section bg-sand">
      <div className="wrap">
        <div ref={headRef} className="mb-14 text-center">
          <span data-a-child className="eyebrow eyebrow--center mb-4 inline-flex">{a.kicker}</span>
          <h2 data-a-child className="text-[clamp(2.4rem,5vw,4rem)]">{a.title}</h2>
          <p data-a-child className="mx-auto mt-4 max-w-[40rem] text-[1.05rem] text-body">{a.sub}</p>
        </div>
        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CITIES.map((city) => (
            <article key={city.name} data-city
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
              <img src={city.img} alt={`${city.name}, Morocco`} width={city.width} height={city.height} loading="lazy" decoding="async"
                className="h-full w-full object-cover transition-transform duration-[1000ms] ease-luxe group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,13,9,0.72)_0%,rgba(16,13,9,0.18)_55%,transparent_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-[1.15rem] font-semibold text-white">{city.name}</h3>
                <p className="mt-0.5 text-[0.7rem] text-white/60">{city.airport}</p>
                <p className="mt-2 flex translate-y-2 items-center gap-1 text-[0.74rem] font-medium text-white/70 opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100">
                  {a.cta} <ArrowRight size={12} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
