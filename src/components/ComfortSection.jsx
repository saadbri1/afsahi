/* "Every detail, already handled." — on-board amenities */
import { Droplets, Zap, Thermometer, Volume2 } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { IMAGES } from "../data/images.js";

const ICONS = [Droplets, Zap, Thermometer, Volume2];

export default function ComfortSection() {
  const { t } = useLang();
  const c = t.comfort;
  const headRef = useScrollReveal({ childSelector: "[data-c-child]" });
  const gridRef = useScrollReveal({ childSelector: "[data-c-card]" });

  return (
    <section className="section bg-sand">
      <div className="wrap">
        <div ref={headRef} className="mb-16 grid items-end gap-8 lg:grid-cols-2">
          <div>
            <span data-c-child className="eyebrow mb-4 inline-flex">{c.kicker}</span>
            <h2 data-c-child className="text-[clamp(2.4rem,5vw,4rem)]">{c.title}</h2>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl lg:row-span-2">
            <img src={IMAGES.sectionOnboard} alt="Chauffeur opening the rear door of a rain-flecked black luxury sedan"
              width="1440" height="961" loading="lazy" decoding="async"
              className="h-full w-full object-cover object-[58%_52%]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,13,9,0.28)_0%,transparent_60%)]" />
          </div>
          <div ref={gridRef} className="grid grid-cols-2 gap-4">
            {c.items.map((item, i) => {
              const Icon = ICONS[i];
              return (
                <div key={i} data-c-card
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 transition-colors hover:bg-paper">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sand text-champ">
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <p className="text-[0.92rem] font-medium leading-snug text-ink">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
