// ─────────────────────────────────────────────────────────────────────────────
// BookingWidget — the hero booking bar. This is the ONLY place trip details are
// entered. Pickup/drop-off (Places autocomplete), date and pickup time all write
// to the shared BookingContext, then "View options" validates and reveals the
// options page, which reads the very same state.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import { useBooking } from "../context/BookingContext.jsx";
import LocationAutocomplete from "./booking/LocationAutocomplete.jsx";
import { buildWhatsAppUrl, SIMPLE_WHATSAPP_MESSAGE } from "../lib/whatsapp.js";

export default function BookingWidget({ onSeePrices }) {
  const { t } = useLang();
  const b = t.book;
  const [tab, setTab] = useState(0); // 0 one-way, 1 hourly (visual toggle)
  const [error, setError] = useState("");

  const {
    pickup, setPickup, dropoff, setDropoff,
    pickupText, setPickupText, dropoffText, setDropoffText,
    date, setDate, time, setTime,
  } = useBooking();

  const submit = (e) => {
    e.preventDefault();
    // Validate on TEXT, not the place object — manual typing is allowed. The
    // route is geocoded from text (or uses the selected place) on the options page.
    if (!pickupText.trim() || !dropoffText.trim() || !date || !time) {
      setError("Please enter pickup, drop-off, date and time to view options.");
      return;
    }
    setError("");
    onSeePrices?.();
  };

  const waHref = buildWhatsAppUrl(SIMPLE_WHATSAPP_MESSAGE);

  return (
    <form id="book" onSubmit={submit} aria-label="Book a ride"
      className="w-full rounded-2xl border border-line bg-paper/95 p-3 shadow-[0_30px_70px_-30px_rgba(21,18,12,0.4)] backdrop-blur-xl">
      {/* tabs */}
      <div className="mb-3 flex gap-1 px-1">
        {[b.oneway, b.hourly].map((label, i) => (
          <button key={i} type="button" onClick={() => setTab(i)}
            className={`rounded-full px-4 py-1.5 text-[0.74rem] font-semibold transition-colors duration-300 ${
              tab === i ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* fields — one row on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1.4fr_1fr_1fr_auto] md:items-stretch">
        <LocationAutocomplete
          label={b.from} placeholder={b.fromPh} variant="from"
          value={pickup} onSelect={setPickup} onTextChange={setPickupText} dropUp
        />
        <LocationAutocomplete
          label={b.to} placeholder={b.toPh} variant="to"
          value={dropoff} onSelect={setDropoff} onTextChange={setDropoffText} dropUp
        />
        <Field icon={<Calendar size={15} />} label={b.date} type="date" value={date} onChange={setDate} />
        <Field icon={<Clock size={15} />} label={b.time} type="time" value={time} onChange={setTime} />
        <button type="submit" data-cursor
          className="shimmer relative flex items-center justify-center rounded-xl bg-champ px-6 py-3 text-[0.78rem] font-semibold text-white transition-all duration-500 ease-luxe hover:bg-champ-dk md:min-w-[8.5rem]">
          {b.cta}
        </button>
      </div>

      {/* reassurance / inline validation + whatsapp */}
      <div className="mt-3 flex flex-col items-center justify-between gap-2 px-1 sm:flex-row">
        <p className={`text-[0.72rem] ${error ? "font-medium text-[#b4452f]" : "text-muted"}`}>
          {error || b.reassure}
        </p>
        <a href={waHref} target="_blank" rel="noopener noreferrer" data-cursor
          className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold text-[#1da851]">
          <WaIcon /> {b.whatsapp}
        </a>
      </div>
    </form>
  );
}

function Field({ icon, label, type = "text", value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition-colors duration-300 focus-within:border-champ">
      <span className="text-champ">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[0.85rem] text-ink outline-none placeholder:text-muted/60 [color-scheme:light]" />
      </span>
    </label>
  );
}

function WaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#1da851" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}
