import { useLang } from "../context/LanguageContext.jsx";
import { useCountUp } from "../hooks/useCountUp.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

export default function TrustBar() {
  const { t } = useLang();
  const ref = useScrollReveal({ childSelector: "[data-reveal-child]" });
  return (
    <section className="border-y border-white/10 bg-surface">
      <div ref={ref} className="wrap grid gap-px py-2 sm:grid-cols-2 lg:grid-cols-4">
        {t.trust.items.map((it, i) => (
          <Stat key={i} item={it} />
        ))}
      </div>
      {/* microcopy strip */}
      <div className="border-t border-white/10">
        <div className="wrap flex flex-wrap items-center justify-center gap-x-7 gap-y-2 py-4 text-[0.72rem] tracking-[0.04em] text-muted">
          {t.trust.strip.map((s, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-champ" /> {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ item }) {
  // animate the numeric part if present
  const num = parseFloat(String(item.v).replace(/[^\d.]/g, ""));
  const hasNum = !Number.isNaN(num) && /\d/.test(item.v);
  const [ref, val] = useCountUp(hasNum ? num : 0);
  const display = hasNum ? String(item.v).replace(String(num), String(val)) : item.v;
  return (
    <div data-reveal-child ref={hasNum ? ref : null} className="px-6 py-7 text-center">
      <div className="font-serif text-[clamp(2rem,3.4vw,2.8rem)] leading-none text-champ">{display}</div>
      <div className="mt-2 text-[0.74rem] uppercase tracking-[0.12em] text-muted">{item.k}</div>
    </div>
  );
}
