/* "Trusted across Morocco" — partner trust strip */
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const PARTNERS = [
  "Four Seasons Casablanca", "Sofitel Marrakech", "Royal Air Maroc",
  "Hyatt Regency", "Marriott Hotels", "Kenzi Hotels", "Pullman Rabat",
  "Air France", "British Airways", "Fairmont The Palm",
];

export default function PartnersSection() {
  const { t } = useLang();
  const p = t.partners;
  const headRef = useScrollReveal({ childSelector: "[data-p-child]" });

  return (
    <section className="section bg-paper">
      <div className="wrap">
        <div ref={headRef} className="mb-14 text-center">
          <h2 data-p-child className="text-[clamp(1.8rem,3.5vw,2.8rem)]">{p.title}</h2>
          <p data-p-child className="mx-auto mt-4 max-w-[38rem] text-[1rem] text-body">{p.sub}</p>
        </div>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-[linear-gradient(to_right,var(--color-paper),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-[linear-gradient(to_left,var(--color-paper),transparent)]" />
          <div className="flex animate-[marquee_28s_linear_infinite] items-center gap-16 whitespace-nowrap"
            style={{ width: "max-content" }}>
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <span key={i}
                className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[["150+", "Corporate clients"], ["50k+", "Journeys completed"], ["4.9/5", "Client rating"]].map(([stat, label], i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-paper px-6 py-8 text-center">
              <span className="text-[2.4rem] font-semibold leading-none tracking-tight text-ink">{stat}</span>
              <span className="text-[0.8rem] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
