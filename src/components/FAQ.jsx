/* "Questions, answered." — light accordion */
import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

export default function FAQ() {
  const { t } = useLang();
  const f = t.faq;
  const [openIdx, setOpenIdx] = useState(0);
  const headRef = useScrollReveal({ childSelector: "[data-fq-child]" });

  return (
    <section id="faq" className="section bg-sand">
      <div className="wrap max-w-[800px]">
        <div ref={headRef} className="mb-14 text-center">
          <span data-fq-child className="eyebrow eyebrow--center mb-4 inline-flex">{f.kicker}</span>
          <h2 data-fq-child className="text-[clamp(2.4rem,5vw,4rem)]">{f.title}</h2>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {f.items.map((item, i) => {
            const open = openIdx === i;
            return (
              <li key={i}>
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className={`text-[1.08rem] font-medium transition-colors duration-300 ${open ? "text-champ-dk" : "text-ink"}`}>
                    {item.q}
                  </span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-ink transition-all duration-300 ${open ? "rotate-45 border-champ bg-sand text-champ-dk" : "border-line"}`}>
                    <Plus size={15} strokeWidth={1.8} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden">
                      <p className="max-w-[58ch] pb-6 pr-10 text-[0.96rem] leading-relaxed text-body">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
