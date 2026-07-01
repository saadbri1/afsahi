import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo, { Wordmark } from "./Logo.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { scrollToHash } from "../hooks/useLenis.js";

const LINKS = [
  { id: "#services", key: "services" },
  { id: "#business", key: "business" },
  { id: "#fleet", key: "fleet" },
  { id: "#faq", key: "help" },
];

export default function Navbar() {
  const { lang, toggle, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e, id) => { e.preventDefault(); setOpen(false); scrollToHash(id); };

  // white over the hero photo, ink once the solid bar appears
  const tone = scrolled ? "text-ink" : "text-white";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className={`fixed left-0 top-0 z-[100] flex w-full items-center justify-between px-[clamp(1.3rem,5vw,2.5rem)] transition-all duration-500 ease-luxe ${tone} ${
        scrolled ? "border-b border-line bg-paper/90 py-3 backdrop-blur-xl" : "border-b border-transparent py-5"
      }`}
    >
      <a href="#hero" onClick={(e) => go(e, "#hero")} className="z-[110] flex items-center gap-3" aria-label="AFSAHI" data-cursor>
        <Logo size={36} />
        <Wordmark />
      </a>

      <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
        {LINKS.map((l) => (
          <a key={l.id} href={l.id} onClick={(e) => go(e, l.id)} data-cursor
            className="group relative whitespace-nowrap text-[0.82rem] tracking-[0.01em] opacity-80 transition-opacity duration-500 hover:opacity-100">
            {t.nav[l.key]}
            <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-champ transition-all duration-500 ease-luxe group-hover:w-full" />
          </a>
        ))}
      </nav>

      <div className="z-[110] flex items-center gap-5">
        <button onClick={toggle} aria-label="Language" data-cursor className="flex gap-[0.35em] text-[0.76rem] tracking-[0.08em] opacity-80">
          <span className={lang === "en" ? "text-champ" : ""}>EN</span>
          <span className="opacity-40">·</span>
          <span className={lang === "fr" ? "text-champ" : ""}>FR</span>
        </button>
        <a href="#book" onClick={(e) => go(e, "#book")} data-cursor
          className="hidden rounded-full bg-champ px-5 py-2.5 text-[0.78rem] font-semibold text-white transition-all duration-500 ease-luxe hover:bg-champ-dk sm:inline-block">
          {t.nav.book}
        </a>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className="flex w-7 flex-col gap-[5px] lg:hidden">
          <span className={`h-px w-full bg-current transition-all duration-500 ease-luxe ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`h-px w-full bg-current transition-all duration-500 ease-luxe ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-full bg-current transition-all duration-500 ease-luxe ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[105] flex flex-col items-center justify-center gap-8 bg-paper text-ink lg:hidden">
            {LINKS.map((l) => (
              <a key={l.id} href={l.id} onClick={(e) => go(e, l.id)} className="text-[1.1rem] tracking-[0.01em]">{t.nav[l.key]}</a>
            ))}
            <a href="#book" onClick={(e) => go(e, "#book")} className="mt-2 rounded-full bg-champ px-7 py-3 text-[0.82rem] font-semibold text-white">{t.nav.book}</a>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
