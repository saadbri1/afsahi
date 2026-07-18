/* "Our Chauffeurs" — premium chauffeur showcase (Blacklane register) */
import { Star, Car } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

// ⬇️ Chauffeur roster — portrait + role + vehicle. imgPos tunes the 4/5 crop.
const CHAUFFEURS = [
  { name: "Soufian", role: "Senior Chauffeur",     vehicle: "Mercedes-Benz E-Class", img: "/images/optimized/chauffeurs/soufian.webp", width: 900, height: 720, imgPos: "50% 22%" },
  { name: "Mohamed", role: "Executive Chauffeur",  vehicle: "Mercedes-Benz S-Class", img: "/images/optimized/chauffeurs/mohamed.webp", width: 900, height: 720, imgPos: "50% 20%" },
  { name: "Anas",    role: "Luxury Van Chauffeur", vehicle: "Mercedes-Benz V-Class", img: "/images/optimized/chauffeurs/anas.webp", width: 825, height: 1100, imgPos: "50% 16%" },
];

function WaGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

export default function Chauffeurs() {
  const headRef = useScrollReveal({ childSelector: "[data-ch-head]" });
  const gridRef = useScrollReveal({ childSelector: "[data-ch-card]" });

  return (
    <section id="chauffeurs" className="section bg-sand">
      <div className="wrap">
        <div ref={headRef} className="mb-14 text-center">
          <span data-ch-head className="eyebrow eyebrow--center mb-4 inline-flex">The people behind the wheel</span>
          <h2 data-ch-head className="text-[clamp(2.4rem,5vw,4rem)]">Our Chauffeurs</h2>
          <p data-ch-head className="mx-auto mt-4 max-w-[40rem] text-[1.05rem] text-body">
            Discreet, professional and meticulously vetted — the chauffeurs who make every AFSAHI journey effortless.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHAUFFEURS.map((c) => {
            const waHref = buildWhatsAppUrl(
              `Bonjour AFSAHI, je souhaite réserver un trajet avec ${c.name}.`
            );
            return (
              <article key={c.name} data-ch-card
                className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_2px_16px_-6px_rgba(21,18,12,0.10)] transition-all duration-500 ease-luxe hover:-translate-y-1.5 hover:border-champ/40 hover:shadow-[0_30px_60px_-30px_rgba(21,18,12,0.30)]">
                {/* portrait — identical 4/5 crop for every card */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={c.img} alt={`${c.name}, ${c.role} at AFSAHI`} width={c.width} height={c.height}
                    loading="lazy" draggable={false}
                    style={{ objectPosition: c.imgPos }}
                    className="h-full w-full object-cover transition-transform duration-[1100ms] ease-luxe group-hover:scale-[1.04]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(16,13,9,0.42)_0%,rgba(16,13,9,0.06)_42%,transparent_70%)]" />
                  {/* name + role over the image base */}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-[1.4rem] font-semibold leading-tight text-white">{c.name}</h3>
                    <p className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-champ-lt">{c.role}</p>
                  </div>
                </div>

                {/* details */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[0.86rem] text-body">
                      <Car size={16} strokeWidth={1.7} className="text-champ" />
                      {c.vehicle}
                    </span>
                    <span className="flex items-center gap-0.5" aria-label="5 star rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className="fill-champ text-champ" strokeWidth={0} />
                      ))}
                    </span>
                  </div>

                  <a href={waHref} target="_blank" rel="noopener noreferrer"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[0.8rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1da851]">
                    <WaGlyph /> Réserver avec {c.name}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
