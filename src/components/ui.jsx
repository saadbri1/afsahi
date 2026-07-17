import { scrollToHash } from "../hooks/useLenis.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

/* Buttons.
   gold  → filled champagne, ink text (primary CTA)
   ghost → outlined, cream text
   wa    → WhatsApp (green tint) */
export function Button({ as = "a", href, children, variant = "gold", block = false, shimmer = true, className = "", onClick, target, ...rest }) {
  const base =
    "relative inline-flex items-center justify-center gap-[0.6em] rounded-[4px] px-7 py-[0.95rem] font-sans text-[0.74rem] font-semibold uppercase tracking-[0.16em] transition-all duration-500 ease-luxe";
  const variants = {
    gold: "bg-champ text-ink hover:-translate-y-0.5 hover:bg-champ-lt hover:shadow-[0_16px_40px_-14px_rgba(197,164,103,0.55)]",
    ghost: "border border-white/15 text-cream hover:border-champ hover:text-champ",
    wa: "border border-[#25D366]/40 text-cream hover:border-[#25D366] hover:bg-[#25D366]/10",
  };
  const cls = `${base} ${variants[variant]} ${block ? "w-full" : ""} ${shimmer && variant === "gold" ? "shimmer" : ""} ${className}`;
  const handle = (e) => {
    if (href && href.startsWith("#")) {
      e.preventDefault();
      scrollToHash(href);
    }
    onClick && onClick(e);
  };
  if (as === "button") {
    return (
      <button className={cls} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <a className={cls} href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} onClick={handle} data-cursor {...rest}>
      {children}
    </a>
  );
}

export function Eyebrow({ children, center = false, className = "" }) {
  return <span className={`eyebrow ${center ? "eyebrow--center" : ""} ${className}`}>{children}</span>;
}

/* Centered section heading with reveal. */
export function SectionHead({ eyebrow, title, text, center = true }) {
  const ref = useScrollReveal({ childSelector: "[data-reveal-child]" });
  return (
    <div ref={ref} className={`mb-[clamp(2.6rem,5vw,4rem)] max-w-[48rem] ${center ? "mx-auto text-center" : ""}`}>
      <div data-reveal-child className="mb-[1.2rem]">
        <Eyebrow center={center}>{eyebrow}</Eyebrow>
      </div>
      <h2 data-reveal-child className="text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.04]">
        {title}
      </h2>
      {text && (
        <p data-reveal-child className={`mt-[1.1rem] text-[1.04rem] text-body ${center ? "mx-auto max-w-[42rem]" : "max-w-[42rem]"}`}>
          {text}
        </p>
      )}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useScrollReveal({ delay, y: 16 });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
