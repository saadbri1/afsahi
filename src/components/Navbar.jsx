import { useEffect, useState } from "react";
import Logo, { Wordmark } from "./Logo.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { scrollToHash } from "../hooks/useLenis.js";

const LINKS = [
  { id: "#services", key: "services" },
  { id: "#business", key: "business" },
  { id: "#nationwide-service", key: "fleet" },
  { id: "#faq", key: "help" },
];

export default function Navbar() {
  const { lang, toggle, t } = useLang();
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const [active, setActive] = useState("#hero");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector("[data-nav-sentinel]");
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = ["#hero", ...LINKS.map((link) => link.id)]
      .map((id) => document.querySelector(id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-28% 0px -58%", threshold: [0, 0.2, 0.5] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const go = (event, id) => {
    event.preventDefault();
    setOpen(false);
    setActive(id);
    scrollToHash(id, { smooth: false });
  };

  const solid = scrolled || open;

  return (
    <header
      className={`nav-enter fixed left-0 top-0 z-[100] flex w-full items-center justify-between px-[clamp(1.3rem,5vw,2.5rem)] transition-[padding,background-color,border-color,color] duration-500 ease-luxe ${solid ? "border-b border-line bg-paper/95 py-3 text-ink backdrop-blur-xl" : "border-b border-transparent py-5 text-white"}`}
    >
      <a href="#hero" onClick={(event) => go(event, "#hero")} className="z-[110] flex items-center gap-3" aria-label="AFSAHI home">
        <Logo size={36} />
        <Wordmark />
      </a>

      <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary navigation">
        {LINKS.map((link) => (
          <a key={link.id} href={link.id} onClick={(event) => go(event, link.id)}
            aria-current={active === link.id ? "location" : undefined}
            className="group relative whitespace-nowrap text-[0.82rem] tracking-[0.01em] opacity-80 transition-opacity duration-300 hover:opacity-100">
            {t.nav[link.key]}
            <span className={`absolute -bottom-1.5 left-0 h-px bg-champ transition-[width] duration-500 ease-luxe ${active === link.id ? "w-full" : "w-0 group-hover:w-full"}`} />
          </a>
        ))}
      </nav>

      <div className="z-[110] flex items-center gap-4 sm:gap-5">
        <button onClick={toggle} aria-label={`Switch language to ${lang === "en" ? "French" : "English"}`}
          className="flex min-h-11 items-center gap-[0.35em] px-1 text-[0.76rem] tracking-[0.08em] opacity-85 transition-opacity hover:opacity-100">
          <span className={lang === "en" ? "text-champ" : ""}>EN</span>
          <span className="opacity-40">·</span>
          <span className={lang === "fr" ? "text-champ" : ""}>FR</span>
        </button>
        <a href="#book" onClick={(event) => go(event, "#book")}
          className="hidden min-h-11 items-center rounded-full bg-champ px-5 py-2.5 text-[0.78rem] font-semibold text-white transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-champ-dk active:translate-y-0 sm:inline-flex">
          {t.nav.book}
        </a>
        <button onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
          className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full lg:hidden">
          <span className={`h-px w-6 bg-current transition-transform duration-500 ease-luxe ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-current transition-transform duration-500 ease-luxe ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="mobile-menu-enter fixed inset-0 z-[105] flex flex-col items-center justify-center gap-7 bg-paper text-ink lg:hidden" aria-label="Mobile navigation">
          {LINKS.map((link) => (
            <a key={link.id} href={link.id} onClick={(event) => go(event, link.id)} className="min-h-11 px-5 py-2 text-[1.1rem] tracking-[0.01em]">
              {t.nav[link.key]}
            </a>
          ))}
          <a href="#book" onClick={(event) => go(event, "#book")} className="mt-2 min-h-12 rounded-full bg-champ px-7 py-3 text-[0.82rem] font-semibold text-white">
            {t.nav.book}
          </a>
        </nav>
      )}
    </header>
  );
}
