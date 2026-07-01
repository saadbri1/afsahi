import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";
import { useLang } from "../context/LanguageContext.jsx";
import { Eyebrow, Button, Reveal } from "./ui.jsx";

/* Alternating image/text feature section. `which` selects copy (airport|hourly).
   `flip` puts the image on the left. */
export default function SplitFeature({ id, which, image, alt, flip = false, dark = false }) {
  const { t } = useLang();
  const data = t[which];
  const imgRef = useRef(null);
  const sectionRef = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce || !imgRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { yPercent: -8 },
        { yPercent: 8, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id={id} ref={sectionRef} className={`section ${dark ? "bg-surface" : ""}`}>
      <div className="wrap grid items-center gap-[clamp(2rem,5vw,4.5rem)] lg:grid-cols-2">
        {/* image */}
        <div className={flip ? "lg:order-1" : "lg:order-2"}>
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_80px_-44px_rgba(0,0,0,0.8)]">
              <img ref={imgRef} src={image} alt={alt} className="h-[clamp(20rem,36vw,30rem)] w-full scale-[1.1] object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_55%,rgba(11,11,12,0.5))]" />
            </div>
          </Reveal>
        </div>
        {/* text */}
        <div className={flip ? "lg:order-2" : "lg:order-1"}>
          <Reveal>
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h2 className="mb-4 mt-4 text-[clamp(2rem,4.4vw,3.3rem)] leading-[1.05]">{data.title}</h2>
            <p className="mb-7 max-w-[38rem] text-[1.04rem] text-body">{data.text}</p>
            <ul className="mb-9 grid gap-3 sm:grid-cols-2">
              {data.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-[0.92rem] text-cream">
                  <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-champ/15 text-champ">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Button href="#book" variant="gold">{data.cta}</Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
