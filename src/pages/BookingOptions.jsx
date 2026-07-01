/* Phase B — Blacklane-style booking options page */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Briefcase, CheckCircle, ChevronRight } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { IMAGES } from "../data/images.js";
import { buildWhatsAppUrl } from "../lib/whatsapp.js";

const VEHICLES = [
  { id: "business",   name: "Business Class",    model: "Mercedes E-Class",    price: 185, pax: 3,  bags: 3,  img: IMAGES.fleetSedan   },
  { id: "first",      name: "First Class",       model: "Mercedes E-Class",    price: 290, pax: 3,  bags: 2,  img: IMAGES.fleetFirst   },
  { id: "premiumsuv", name: "Premium SUV",       model: "Skoda Kodiaq",        price: 260, pax: 5,  bags: 5,  img: IMAGES.fleetSuv     },
  { id: "premium",    name: "Premium Sedan",     model: "Skoda Superb",        price: 160, pax: 3,  bags: 3,  img: IMAGES.fleetPremium },
  { id: "economy",    name: "Economy Sedan",     model: "Skoda Superb",        price: 120, pax: 3,  bags: 3,  img: IMAGES.fleetEconomy },
  { id: "van",        name: "Business Van",      model: "Mercedes V-Class",    price: 220, pax: 7,  bags: 7,  img: IMAGES.fleetVan     },
  { id: "vanexec",    name: "Executive Van",     model: "Mercedes V-Class",    price: 240, pax: 6,  bags: 6,  img: IMAGES.fleetVanExec },
  { id: "minibus",    name: "VIP Minibus",       model: "Mercedes Sprinter",   price: 320, pax: 12, bags: 12, img: IMAGES.fleetMinibus },
  { id: "shuttle",    name: "Premium Shuttle",   model: "Ford Tourneo Custom", price: 200, pax: 8,  bags: 8,  img: IMAGES.fleetShuttle },
];

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

const springBtn = { type: "spring", stiffness: 300, damping: 20 };

export default function BookingOptions({ onBack }) {
  const { t } = useLang();
  const bk = t.booking;
  const [selectedId, setSelectedId]   = useState("business");
  const [bookingType, setBookingType] = useState("myself");
  const [offerCode, setOfferCode]     = useState("");
  const [offerOpen, setOfferOpen]     = useState(false);
  const [activeTab, setActiveTab]     = useState("included");

  const selected = VEHICLES.find(v => v.id === selectedId) || VEHICLES[0];
  const tax   = Math.round(selected.price * 0.085);
  const total = selected.price + tax;

  return (
    <div className="min-h-screen bg-paper">

      {/* sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-xl">
        <div className="wrap flex h-16 items-center gap-6">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={springBtn}
            className="flex items-center gap-2 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            {bk.back}
          </motion.button>
          <div className="h-4 w-px bg-line" />
          <div className="flex items-center gap-2 text-[0.82rem] text-ink">
            <span className="font-semibold">Casablanca Airport</span>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-semibold">Four Seasons Hotel</span>
          </div>
          <div className="ml-auto text-[0.78rem] text-muted">Today · 14:30</div>
        </div>
      </div>

      <div className="wrap py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT COLUMN ──────────────────────────────────── */}
          <div className="min-w-0">
            <h1 className="mb-8 text-[1.6rem] font-semibold text-ink">{bk.choose}</h1>

            {/* vehicle cards */}
            <div className="space-y-3">
              {VEHICLES.map((v) => {
                const isSelected = selectedId === v.id;
                const isLargeVan = v.id === "minibus";
                const isVan = v.id === "van" || v.id === "vanexec" || v.id === "shuttle";
                const isSuv = v.id === "premiumsuv";
                const imgStyle = isLargeVan
                  ? { objectFit: "cover", objectPosition: "center 60%", transform: "scale(1.22)", transformOrigin: "center", width: "100%", height: "100%", display: "block" }
                  : isVan
                  ? { objectFit: "cover", objectPosition: "center 65%", transform: "scale(1.28)", transformOrigin: "center", width: "100%", height: "100%", display: "block" }
                  : isSuv
                  ? { objectFit: "cover", objectPosition: "center 69%", transform: "scale(1.25)", transformOrigin: "center", width: "100%", height: "100%", display: "block" }
                  : { objectFit: "cover", objectPosition: "center 70%", transform: "scale(1.32)", transformOrigin: "center", width: "100%", height: "100%", display: "block" };

                return (
                  <motion.button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    animate={{
                      boxShadow: isSelected
                        ? "0 0 0 2px rgba(169,130,63,0.50), 0 8px 28px -8px rgba(169,130,63,0.28)"
                        : "0 0 0 0px rgba(169,130,63,0)",
                    }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className={`group w-full overflow-hidden rounded-3xl border text-left ${
                      isSelected
                        ? "border-champ bg-[#fdf9f2]"
                        : "border-line bg-surface hover:border-champ/40 hover:bg-sand/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row" style={{ minHeight: "200px" }}>
                      {/* image */}
                      <div className="h-[200px] shrink-0 overflow-hidden sm:w-[280px]"
                        style={{ background: "linear-gradient(180deg, #ede3d0 0%, #f5efe4 60%, #faf5ec 100%)" }}>
                        <img src={v.img} alt={v.name} loading="lazy" style={imgStyle} />
                      </div>
                      {/* text */}
                      <div className="flex flex-1 flex-col justify-center px-6 py-5">
                        <p className="text-[1.05rem] font-semibold text-ink">{v.name}</p>
                        <p className="mt-0.5 text-[0.8rem] text-muted">{v.model} {bk.details}</p>
                        <div className="mt-3 flex items-center gap-4 text-[0.78rem] text-muted">
                          <span className="flex items-center gap-1.5"><Users size={13} strokeWidth={1.7} />{v.pax} guests</span>
                          <span className="flex items-center gap-1.5"><Briefcase size={13} strokeWidth={1.7} />{v.bags} bags</span>
                        </div>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 self-start rounded-full border border-champ bg-champ/10 px-3 py-1 text-[0.7rem] font-semibold text-champ-dk"
                            >
                              {bk.selected}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* price */}
                      <div className="flex shrink-0 flex-col items-end justify-center px-6 py-5 sm:w-[160px]">
                        <p className={`text-[1.4rem] font-semibold leading-tight ${isSelected ? "text-champ-dk" : "text-ink"}`}>
                          €{v.price}
                        </p>
                        <p className="mt-1 text-[0.68rem] text-muted">{bk.allIn}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* selected vehicle showcase */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-line shadow-[0_4px_24px_-10px_rgba(21,18,12,0.13)]">
              <div className="flex flex-col sm:flex-row">
                {/* portrait car panel */}
                <div className="relative shrink-0 overflow-hidden sm:w-[42%]"
                  style={{ background: "radial-gradient(ellipse at 58% 62%, #fffaf2 0%, #ede3d0 44%, #e0d4c0 100%)" }}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selected.id}
                      src={selected.img}
                      alt={selected.name}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full w-full object-contain"
                      style={{ minHeight: "280px" }}
                    />
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[12%]"
                    style={{ background: "linear-gradient(to top, #e8dfd0 0%, transparent 100%)" }} />
                </div>

                {/* info panel */}
                <div className="flex flex-1 flex-col bg-surface">
                  <div className="border-b border-line px-7 py-6">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-champ">Selected Vehicle</p>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={selected.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="mt-2 text-[1.65rem] font-semibold leading-tight text-ink"
                      >
                        {selected.name}
                      </motion.h3>
                    </AnimatePresence>
                    <p className="mt-1 text-[0.88rem] text-muted">{selected.model}</p>
                    <div className="mt-4 flex items-center gap-5 text-[0.82rem] text-muted">
                      <span className="flex items-center gap-1.5"><Users size={14} strokeWidth={1.7} />{selected.pax} guests</span>
                      <span className="flex items-center gap-1.5"><Briefcase size={14} strokeWidth={1.7} />{selected.bags} bags</span>
                    </div>
                  </div>

                  {/* tabs */}
                  <div className="border-b border-line">
                    <div className="flex">
                      {[["included", bk.included], ["capacity", bk.capacity], ["price", bk.price]].map(([key, label]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                          className={`px-5 py-4 text-[0.82rem] font-semibold transition-all ${activeTab === key ? "border-b-2 border-champ text-champ-dk" : "text-muted hover:text-ink"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* tab content */}
                  <div className="flex-1 px-7 py-6">
                    <AnimatePresence mode="wait">
                      {activeTab === "included" && (
                        <motion.div key="included"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="grid gap-3 sm:grid-cols-2">
                          {bk.includedItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-[0.9rem] text-body">
                              <CheckCircle size={16} className="shrink-0 text-champ" strokeWidth={1.8} />
                              {item}
                            </div>
                          ))}
                        </motion.div>
                      )}
                      {activeTab === "capacity" && (
                        <motion.div key="capacity"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="grid gap-8 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-widest text-muted">{bk.seating}</p>
                            <div className="flex items-center gap-3">
                              <Users size={28} strokeWidth={1.4} className="text-champ" />
                              <span className="text-[2rem] font-semibold text-ink">{selected.pax}</span>
                              <span className="text-[0.9rem] text-muted">guests</span>
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-widest text-muted">{bk.luggage}</p>
                            <div className="flex items-center gap-3">
                              <Briefcase size={28} strokeWidth={1.4} className="text-champ" />
                              <span className="text-[2rem] font-semibold text-ink">{selected.bags}</span>
                              <span className="text-[0.9rem] text-muted">bags</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {activeTab === "price" && (
                        <motion.div key="price"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4">
                          {[
                            [bk.baseFare, `€${selected.price}`],
                            [bk.tax,      `€${tax}`],
                          ].map(([label, val]) => (
                            <div key={label} className="flex items-center justify-between border-b border-line pb-4 text-[0.92rem]">
                              <span className="text-body">{label}</span>
                              <span className="font-medium text-ink">{val}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-semibold text-ink">{bk.total}</span>
                            <span className="text-[1.3rem] font-semibold text-ink">€{total}</span>
                          </div>
                          <p className="text-[0.76rem] text-muted">{bk.allIn}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[0.78rem] leading-relaxed text-muted">{bk.notes}</p>
          </div>

          {/* ── RIGHT STICKY PANEL ───────────────────────────── */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-line bg-surface shadow-[0_20px_60px_-24px_rgba(21,18,12,0.14)]">
              {/* map placeholder */}
              <div className="relative h-44 overflow-hidden rounded-t-2xl bg-sand">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 rounded-full border-2 border-champ bg-white" />
                    <p className="text-[0.72rem] font-medium text-muted">{bk.mapNote}</p>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(255,255,255,0.9),transparent)]" />
              </div>

              <div className="p-6">
                {/* booking summary — animated number changes */}
                <div className="mb-6">
                  <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-widest text-muted">{bk.summary}</p>
                  <div className="space-y-1.5 text-[0.84rem]">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-muted">Vehicle</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={selected.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="text-right font-medium text-ink"
                        >
                          {selected.name}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Total</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={total}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="font-semibold text-ink"
                        >
                          €{total}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* booking type */}
                <div className="mb-6 space-y-2">
                  {[
                    { id: "myself", title: bk.forMyself, sub: bk.forMyselfSub },
                    { id: "guest",  title: bk.forGuest,  sub: bk.forGuestSub  },
                  ].map((opt) => (
                    <motion.button
                      key={opt.id}
                      onClick={() => setBookingType(opt.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springBtn}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${bookingType === opt.id ? "border-champ bg-sand" : "border-line hover:border-champ/40 hover:bg-sand/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[0.88rem] font-semibold text-ink">{opt.title}</p>
                          <p className="mt-0.5 text-[0.76rem] text-muted">{opt.sub}</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border-2 transition-all ${bookingType === opt.id ? "border-champ bg-champ" : "border-line"}`} />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* apply offer */}
                <div className="mb-6">
                  <motion.button
                    onClick={() => setOfferOpen(!offerOpen)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={springBtn}
                    className="flex w-full items-center justify-between text-[0.84rem] font-medium text-ink"
                  >
                    <span>{bk.applyOffer}</span>
                    <motion.span
                      animate={{ rotate: offerOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted"
                    >
                      <ChevronRight size={16} />
                    </motion.span>
                  </motion.button>
                  <AnimatePresence>
                    {offerOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex gap-2">
                          <input type="text" value={offerCode} onChange={(e) => setOfferCode(e.target.value)}
                            placeholder="Enter code"
                            className="min-w-0 flex-1 rounded-xl border border-line px-4 py-2.5 text-[0.84rem] text-ink outline-none transition-colors focus:border-champ" />
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={springBtn}
                            className="rounded-xl border border-line px-4 py-2.5 text-[0.84rem] font-medium text-ink transition-colors hover:border-champ hover:text-champ-dk"
                          >
                            Apply
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* select CTA */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springBtn}
                  className="w-full rounded-2xl bg-ink py-4 text-[0.88rem] font-semibold tracking-wide text-cream transition-colors duration-300 hover:bg-champ-dk"
                >
                  {bk.select} {selected.name}
                </motion.button>

                <div className="mt-3 text-center">
                  <a href={buildWhatsAppUrl(`Bonjour AFSAHI, je souhaite réserver un trajet privé. Véhicule: ${selected.name}.`)}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[0.78rem] font-medium text-[#1da851]">
                    <WaIcon /> Book on WhatsApp
                  </a>
                </div>
                <p className="mt-4 text-center text-[0.72rem] text-muted">Free cancellation up to 24h · No hidden fees</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
