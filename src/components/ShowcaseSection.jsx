/* "Priced before you ride." — online booking showcase */
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { IMAGES } from "../data/images.js";

function BookingMockup() {
  return (
    <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-[0_20px_60px_-24px_rgba(21,18,12,0.14)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-champ" />
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-champ-dk">Choose your experience</span>
      </div>
      <div className="space-y-3">
        {[
          { name: "Business Class", model: "Mercedes E-Class", price: "€185", pax: 3, selected: false },
          { name: "First Class", model: "Mercedes S-Class", price: "€290", pax: 3, selected: true },
          { name: "Premium SUV", model: "Mercedes GLS", price: "€260", pax: 5, selected: false },
        ].map((v, i) => (
          <div key={i}
            className={`flex items-center justify-between rounded-xl border p-4 transition-all ${v.selected ? "border-champ bg-sand shadow-[inset_0_0_0_1px_rgba(169,130,63,0.3)]" : "border-line hover:border-line/80 hover:bg-sand/60"}`}>
            <div>
              <p className={`text-[0.88rem] font-semibold ${v.selected ? "text-ink" : "text-ink"}`}>{v.name}</p>
              <p className="mt-0.5 text-[0.76rem] text-muted">{v.model} · {v.pax} guests</p>
            </div>
            <div className="text-right">
              <p className={`text-[1.05rem] font-semibold ${v.selected ? "text-champ-dk" : "text-ink"}`}>{v.price}</p>
              {v.selected && <p className="mt-0.5 text-[0.7rem] text-champ-dk">Selected</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-ink p-4">
        <button className="w-full text-center text-[0.84rem] font-semibold tracking-wide text-cream">
          Select First Class
        </button>
      </div>
      <div className="mt-3 text-center">
        <p className="text-[0.7rem] text-muted">All fees included · Free cancellation</p>
      </div>
    </div>
  );
}

export default function ShowcaseSection({ onSeePrices }) {
  const { t } = useLang();
  const s = t.showcase;
  const textRef = useScrollReveal({ childSelector: "[data-sc-child]" });
  const cardRef = useScrollReveal();

  return (
    <section className="section bg-paper">
      <div className="wrap">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div ref={textRef} className="flex flex-col gap-6">
            <span data-sc-child className="eyebrow">{s.kicker}</span>
            <h2 data-sc-child className="text-[clamp(2.2rem,4vw,3.6rem)]">{s.title}</h2>
            <p data-sc-child className="max-w-[40ch] text-[1.05rem] leading-relaxed text-body">{s.sub}</p>
            <ul data-sc-child className="flex flex-col gap-3 pt-2">
              {s.bullets.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[0.95rem] text-body">
                  <CheckCircle size={17} className="shrink-0 text-champ" strokeWidth={1.8} />
                  {item}
                </li>
              ))}
            </ul>
            <div data-sc-child className="pt-3">
              <button onClick={onSeePrices}
                className="inline-flex items-center gap-2 rounded-full bg-champ px-8 py-4 text-[0.84rem] font-semibold tracking-wide text-white shadow-[0_4px_24px_rgba(169,130,63,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-champ-dk hover:shadow-[0_8px_32px_rgba(169,130,63,0.5)]">
                {s.cta}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div ref={cardRef}>
            <BookingMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
