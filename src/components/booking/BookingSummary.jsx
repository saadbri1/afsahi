// ─────────────────────────────────────────────────────────────────────────────
// BookingSummary — trip recap + REQUIRED client details + confirmation modal.
//
// Flow: fill name/phone/email → "Reserve via WhatsApp" opens a confirmation
// modal (full recap) → Confirm → save to Supabase + open WhatsApp + success.
// The button stays disabled until route, price AND client details are valid.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, Phone, Mail, CheckCircle2, X } from "lucide-react";
import { calculatePrice, convertToEuro, formatCurrency } from "../../data/bookingPricing.js";
import { buildWhatsAppUrl, buildBookingMessage } from "../../lib/whatsapp.js";
import { addReservation } from "../../lib/reservations.js";

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[0.74rem] uppercase tracking-[0.1em] text-muted">{label}</span>
      <span className={`min-w-0 truncate text-right text-[0.85rem] ${strong ? "font-semibold text-ink" : "text-body"}`}>
        {/* 0 is a valid value (zero bags) — don't let it fall through to "—" */}
        {value === 0 ? 0 : value || "—"}
      </span>
    </div>
  );
}

const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
const validPhone = (s) => (s.replace(/\D/g, "").length >= 8);

export default function BookingSummary({
  pickupLabel,
  dropoffLabel,
  date,
  time,
  distanceKm,
  durationText,
  routeStatus,
  vehicle,
  passengers = 1,
  bags = 0,
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [modal, setModal] = useState(false);     // confirmation modal
  const [success, setSuccess] = useState(false); // post-confirm success state
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!modal) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  const priceMad = vehicle ? calculatePrice(distanceKm, vehicle.pricePerKm) : null;
  const priceEur = convertToEuro(priceMad);

  const tripReady = !!(pickupLabel && dropoffLabel && date && time && vehicle && priceMad != null);
  const clientReady = clientName.trim().length >= 2 && validPhone(clientPhone) && validEmail(clientEmail);
  const ready = tripReady && clientReady;

  const priceState =
    !vehicle ? "Select a vehicle first."
    : !pickupLabel ? "Choose pickup location."
    : !dropoffLabel ? "Choose destination."
    : routeStatus === "error" ? "Unable to calculate distance."
    : "Calculating…";

  const helper =
    !tripReady ? "Complete pickup, drop-off, date, time & vehicle to reserve."
    : !clientName.trim() ? "Enter your full name to reserve."
    : !validPhone(clientPhone) ? "Enter a valid WhatsApp / phone number."
    : !validEmail(clientEmail) ? "Enter a valid email address."
    : null;

  const buildMessage = () =>
    buildBookingMessage({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      pickup: pickupLabel,
      dropoff: dropoffLabel,
      vehicle: vehicle?.name,
      distanceKm,
      priceMad,
      priceEur,
      date,
      time,
      passengers,
      luggage: bags,
    });

  // Runs ONLY after the client presses "Confirm reservation" in the modal.
  const confirmReservation = async () => {
    if (saving) return;
    const message = buildMessage();
    setSaving(true);
    setSubmitError("");
    try {
      await addReservation({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        pickup: pickupLabel,
        dropoff: dropoffLabel,
        date,
        time,
        vehicle: vehicle?.name,
        // the customer's requested counts — NOT the vehicle's capacity
        passengers,
        luggage: bags,
        distanceKm,
        durationText,
        priceMad,
        priceEur,
        message,
      });
      const whatsappUrl = buildWhatsAppUrl(message);
      const whatsappWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!whatsappWindow) {
        window.location.assign(whatsappUrl);
      }
      setSuccess(true);
    } catch (error) {
      console.error("[AFSAHI] Failed to save reservation:", error);
      setSubmitError("We couldn't save the request. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => { if (!saving) { setModal(false); setSuccess(false); setSubmitError(""); } };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_2px_16px_-8px_rgba(21,18,12,0.12)]">
      <h3 className="text-[1.05rem] font-semibold text-ink">Booking summary</h3>
      <div className="mt-3 divide-y divide-line/70">
        <Row label="Vehicle" value={vehicle?.name} strong />
        <Row label="Pickup" value={pickupLabel} />
        <Row label="Drop-off" value={dropoffLabel} />
        <Row label="Date" value={date} />
        <Row label="Time" value={time} />
        <Row label="Distance" value={distanceKm != null ? `${distanceKm} km` : routeStatus === "error" ? "Unavailable" : "Calculating…"} />
        <Row label="Duration" value={durationText || (routeStatus === "error" ? "Unavailable" : "Calculating…")} />
        <Row label="Passengers" value={passengers} />
        <Row label="Bags" value={bags} />
      </div>

      {/* Premium dark price card — MAD large/bold/white, EUR smaller/gold */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-noir p-5 text-center shadow-[0_18px_40px_-22px_rgba(21,18,12,0.6)]">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-cream/45">Estimated price</p>
        {priceMad != null ? (
          <motion.div key={priceMad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mt-2 text-[2.1rem] font-bold leading-none text-white">
              {priceMad}<span className="ml-1.5 align-baseline text-[1.05rem] font-semibold">MAD</span>
            </p>
            <p className="mt-2 text-[0.98rem] font-medium text-champ-lt">≈ €{priceEur.toFixed(2)}</p>
          </motion.div>
        ) : (
          <p className="mt-3 text-[0.86rem] font-medium italic text-cream/55">{priceState}</p>
        )}
        <p className="mt-3 text-[0.66rem] text-cream/35">All fees included</p>
      </div>

      {/* REQUIRED client details */}
      <div className="mt-5 space-y-2.5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Your details</p>
        <ClientField label="Full name" icon={<UserRound size={15} />} type="text" placeholder="Full name"
          value={clientName} onChange={setClientName} autoComplete="name" invalid={Boolean(clientName) && clientName.trim().length < 2} />
        <ClientField label="Phone or WhatsApp number" icon={<Phone size={15} />} type="tel" placeholder="Phone / WhatsApp number"
          value={clientPhone} onChange={setClientPhone} autoComplete="tel" invalid={Boolean(clientPhone) && !validPhone(clientPhone)} />
        <ClientField label="Email address" icon={<Mail size={15} />} type="email" placeholder="Email address"
          value={clientEmail} onChange={setClientEmail} autoComplete="email" invalid={Boolean(clientEmail) && !validEmail(clientEmail)} />
      </div>

      <motion.button
        type="button"
        onClick={() => ready && setModal(true)}
        disabled={!ready}
        whileHover={ready ? { scale: 1.02 } : {}}
        whileTap={ready ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[0.82rem] font-semibold transition-colors duration-300 ${
          ready ? "bg-[#25D366] text-white hover:bg-[#1da851]" : "cursor-not-allowed bg-line text-muted"
        }`}
      >
        <WaIcon /> Reserve via WhatsApp
      </motion.button>
      {helper && <p className="mt-2 text-center text-[0.72rem] text-muted">{helper}</p>}

      {/* ── Confirmation modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div key="confirm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-labelledby="booking-confirm-title"
            className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-noir/65 p-4 backdrop-blur-sm"
            onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[440px] rounded-3xl border border-champ/25 bg-surface p-6 shadow-[0_50px_110px_-35px_rgba(0,0,0,0.6)]">
              {!success ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 id="booking-confirm-title" className="text-[1.1rem] font-semibold text-ink">Confirm your reservation</h4>
                    <button onClick={closeModal} aria-label="Close confirmation" autoFocus className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-line/60">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="divide-y divide-line/60 rounded-2xl border border-line bg-paper px-4 py-1">
                    <Row label="Name" value={clientName} strong />
                    <Row label="Phone" value={clientPhone} />
                    <Row label="Email" value={clientEmail} />
                    <Row label="Pickup" value={pickupLabel} />
                    <Row label="Drop-off" value={dropoffLabel} />
                    <Row label="Date" value={date} />
                    <Row label="Time" value={time} />
                    <Row label="Vehicle" value={vehicle?.name} />
                    <Row label="Passengers" value={passengers} />
                    <Row label="Bags" value={bags} />
                    <Row label="Distance" value={distanceKm != null ? `${distanceKm} km` : "—"} />
                    <Row label="Duration" value={durationText} />
                    <Row label="Final price" value={priceMad != null ? `${formatCurrency(priceMad)} · ≈ €${priceEur.toFixed(2)}` : "—"} strong />
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button onClick={closeModal}
                      className="flex-1 rounded-xl border border-line px-5 py-3 text-[0.8rem] font-semibold text-body transition-colors hover:border-ink hover:text-ink">
                      Cancel
                    </button>
                    <motion.button onClick={confirmReservation} disabled={saving}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex-[1.4] rounded-xl bg-champ px-5 py-3 text-[0.8rem] font-semibold text-white transition-colors hover:bg-champ-dk disabled:cursor-wait disabled:opacity-60">
                      {saving ? "Saving securely…" : "Confirm reservation"}
                    </motion.button>
                  </div>
                  <div className="min-h-8 pt-2" aria-live="polite">
                    {submitError && <p className="text-center text-[0.75rem] font-medium text-red-700">{submitError}</p>}
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-4 text-center">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/12 text-emerald-600">
                    <CheckCircle2 size={34} strokeWidth={1.6} />
                  </motion.span>
                  <h4 className="mt-4 text-[1.15rem] font-semibold text-ink">Reservation sent</h4>
                  <p className="mx-auto mt-2 max-w-[30ch] text-[0.84rem] leading-relaxed text-body">
                    Your request is saved and WhatsApp has opened with your booking
                    details — send the message and our concierge will confirm shortly.
                  </p>
                  <button onClick={closeModal}
                    className="mt-6 rounded-full bg-noir px-8 py-3 text-[0.8rem] font-semibold text-cream transition-colors hover:bg-ink">
                    Done
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientField({ label, icon, type, placeholder, value, onChange, autoComplete, invalid }) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border bg-paper px-4 py-3 transition-colors duration-300 focus-within:border-champ ${invalid ? "border-red-500" : "border-line"}`}>
      <span className="sr-only">{label}</span>
      <span className="text-champ">{icon}</span>
      <input
        type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[0.86rem] text-ink outline-none placeholder:text-muted/60"
      />
    </label>
  );
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}
