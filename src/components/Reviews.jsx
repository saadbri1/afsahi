/* "Trusted by those who don't compromise." — rotating testimonials */
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Star } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

export default function Reviews() {
  const { t } = useLang();
  const r = t.reviews;
  const [current, setCurrent] = useState(0);
  const quoteRef = useRef(null);
  const reduce = usePrefersReducedMotion();
  const headRef = useScrollReveal({ childSelector: "[data-rv-child]" });

  const go = (i) => {
    if (reduce) { setCurrent(i); return; }
    gsap.to(quoteRef.current, {
      opacity: 0, y: 10, duration: 0.25, ease: "power2.in",
      onComplete: () => {
        setCurrent(i);
        gsap.fromTo(quoteRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
      },
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (current + 1) % r.items.length;
      go(next);
    }, 6000);
    return () => clearInterval(interval);
  }, [current, r.items.length]);

  const item = r.items[current];

  return (
    <section className="section bg-paper">
      <div className="wrap">
        <div ref={headRef} className="mb-16 text-center">
          <span data-rv-child className="eyebrow eyebrow--center mb-4 inline-flex">{r.kicker}</span>
          <h2 data-rv-child className="text-[clamp(2.4rem,5vw,4rem)]">{r.title}</h2>
          <div data-rv-child className="mt-5 flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" className="text-champ" />)}
            <span className="ml-1 text-[0.82rem] font-semibold text-muted">{r.rated}</span>
          </div>
        </div>
        <div className="mx-auto max-w-[46rem] text-center">
          <div ref={quoteRef} className="mb-10">
            <p className="text-[clamp(1.35rem,2.8vw,2rem)] leading-[1.55] text-ink">
              <span className="text-champ">"</span>{item.q}<span className="text-champ">"</span>
            </p>
            <p className="mt-6 text-[0.9rem] font-semibold text-ink">{item.name}</p>
            <p className="mt-0.5 text-[0.8rem] text-muted">{item.city}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            {r.items.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Review ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-champ" : "w-3 bg-line hover:bg-muted/50"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
