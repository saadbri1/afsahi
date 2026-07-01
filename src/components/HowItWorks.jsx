import { PencilLine, BadgeCheck, CarFront } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { SectionHead } from "./ui.jsx";

const ICONS = [PencilLine, BadgeCheck, CarFront];

export default function HowItWorks() {
  const { t } = useLang();
  const ref = useScrollReveal({ childSelector: "[data-reveal-child]" });
  return (
    <section id="how" className="section bg-surface">
      <div className="wrap">
        <SectionHead eyebrow={t.how.eyebrow} title={t.how.title} />
        <div ref={ref} className="relative grid gap-6 lg:grid-cols-3">
          {/* connecting hairline */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[3.4rem] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(197,164,103,0.4),transparent)] lg:block" />
          {t.how.steps.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} data-reveal-child className="relative text-center">
                <div className="relative z-[2] mx-auto mb-6 grid h-[4.2rem] w-[4.2rem] place-items-center rounded-full border border-champ/30 bg-ink text-champ">
                  <Icon size={26} strokeWidth={1.4} />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-champ font-sans text-[0.7rem] font-bold text-ink">{i + 1}</span>
                </div>
                <h3 className="mb-2 text-[1.45rem]">{s.t}</h3>
                <p className="mx-auto max-w-[22rem] text-[0.93rem] text-body">{s.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
