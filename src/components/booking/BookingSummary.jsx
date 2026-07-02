// ─────────────────────────────────────────────────────────────────────────────
// BookingSummary — recap of the trip + "Reserve via WhatsApp" CTA.
// The button is disabled until pickup, drop-off, date, time and a vehicle are set.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { calculatePrice, convertToEuro } from "../../data/bookingPricing.js";
import { buildWhatsAppUrl, buildBookingMessage } from "../../lib/whatsapp.js";
import { addReservation } from "../../lib/reservations.js";

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[0.74rem] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-[0.85rem] ${
          strong ? "font-semibold text-ink" : "text-body"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function BookingSummary({
  pickupLabel,
  dropoffLabel,
  date,
  time,
  distanceKm,
  durationText,
  routeStatus,
  vehicle,
}) {
  const priceMad = vehicle ? calculatePrice(distanceKm, vehicle.pricePerKm) : null;
  const priceEur = convertToEuro(priceMad);
  const ready = !!(pickupLabel && dropoffLabel && date && time && vehicle && priceMad != null);

  // Premium price-card state messages (validation).
  const priceState =
    !vehicle ? "Select a vehicle first."
    : !pickupLabel ? "Choose pickup location."
    : !dropoffLabel ? "Choose destination."
    : routeStatus === "error" ? "Unable to calculate distance."
    : "Calculating…";

  const reserve = () => {
    if (!ready) return;
    const message = buildBookingMessage({
      pickup: pickupLabel,
      dropoff: dropoffLabel,
      vehicle: vehicle?.name,
      distanceKm,
      priceMad,
      priceEur,
      date,
      time,
      passengers: vehicle?.passengers,
      luggage: vehicle?.luggage,
    });

    // 1. Save the reservation to Supabase (fire-and-forget: a network/storage
    //    failure must never block the client's WhatsApp booking, and awaiting
    //    here could trip popup blockers on the window.open below).
    addReservation({
      pickup: pickupLabel,
      dropoff: dropoffLabel,
      date,
      time,
      vehicle: vehicle?.name,
      passengers: vehicle?.passengers,
      luggage: vehicle?.luggage,
      distanceKm,
      durationText,
      priceMad,
      priceEur,
      message,
    }).catch((err) => console.error("[AFSAHI] Failed to save reservation:", err));

    // 2. Open WhatsApp with the complete booking message.
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_2px_16px_-8px_rgba(21,18,12,0.12)]">
      <h3 className="text-[1.05rem] font-semibold text-ink">Booking summary</h3>
      <div className="mt-3 divide-y divide-line/70">
        <Row label="Vehicle" value={vehicle?.name} strong />
        <Row label="Pickup" value={pickupLabel} />
        <Row label="Drop-off" value={dropoffLabel} />
        <Row label="Date" value={date} />
        <Row label="Time" value={time} />
        <Row
          label="Distance"
          value={distanceKm != null ? `${distanceKm} km` : routeStatus === "error" ? "Unavailable" : "Calculating…"}
        />
        <Row
          label="Duration"
          value={durationText || (routeStatus === "error" ? "Unavailable" : "Calculating…")}
        />
      </div>

      {/* Premium dark price card — MAD large/bold/white, EUR smaller/gold */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-noir p-5 text-center shadow-[0_18px_40px_-22px_rgba(21,18,12,0.6)]">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-cream/45">
          Estimated price
        </p>
        {priceMad != null ? (
          <motion.div
            key={priceMad}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mt-2 text-[2.1rem] font-bold leading-none text-white">
              {priceMad}
              <span className="ml-1.5 text-[1.05rem] font-semibold align-baseline">MAD</span>
            </p>
            <p className="mt-2 text-[0.98rem] font-medium text-champ-lt">
              ≈ €{priceEur.toFixed(2)}
            </p>
          </motion.div>
        ) : (
          <p className="mt-3 text-[0.86rem] font-medium italic text-cream/55">{priceState}</p>
        )}
        <p className="mt-3 text-[0.66rem] text-cream/35">All fees included</p>
      </div>

      <motion.button
        type="button"
        onClick={reserve}
        disabled={!ready}
        whileHover={ready ? { scale: 1.02 } : {}}
        whileTap={ready ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[0.82rem] font-semibold transition-colors duration-300 ${
          ready
            ? "bg-[#25D366] text-white hover:bg-[#1da851]"
            : "cursor-not-allowed bg-line text-muted"
        }`}
      >
        <WaIcon /> Reserve via WhatsApp
      </motion.button>
      {!ready && (
        <p className="mt-2 text-center text-[0.72rem] text-muted">
          Complete pickup, drop-off, date, time &amp; vehicle to reserve.
        </p>
      )}
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}
