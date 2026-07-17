// ─────────────────────────────────────────────────────────────────────────────
// BookingSystem — the OPTIONS page. Display + car choice ONLY.
//
// It enters NO trip details. Pickup, drop-off, date and time are entered once in
// the hero booking bar and read here from the shared BookingContext. This page
// renders the route map, distance, duration, vehicle cards (km-based price),
// booking summary and WhatsApp CTA — all sourced from that single state.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Calendar, Clock } from "lucide-react";
import { VEHICLES } from "../data/bookingPricing.js";
import { useBooking } from "../context/BookingContext.jsx";
import RouteMap from "../components/booking/RouteMap.jsx";
import VehicleCard from "../components/booking/VehicleCard.jsx";
import BookingSummary from "../components/booking/BookingSummary.jsx";

export default function BookingSystem({ onBack }) {
  const {
    pickup, dropoff, pickupText, dropoffText, date, time,
    distanceKm, durationText, routeStatus, setRoute,
    selectedVehicleId, setSelectedVehicleId,
  } = useBooking();

  // Display strings — selected place address wins, else the manually typed text.
  const pickupLabel = pickup?.formattedAddress || pickup?.description || pickupText;
  const dropoffLabel = dropoff?.formattedAddress || dropoff?.description || dropoffText;

  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || null;

  return (
    <div className="min-h-screen bg-paper">
      {/* sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-xl">
        <div className="wrap flex h-16 items-center gap-6">
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-2 text-[0.82rem] font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            Back
          </motion.button>
          <div className="h-4 w-px bg-line" />
          <div className="text-[0.82rem] font-medium text-ink">Plan your transfer</div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 lg:py-12">
        {/* heading + READ-ONLY trip recap (no editable fields here) */}
        <div className="mb-8">
          <span className="eyebrow mb-3 inline-flex">Your options</span>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)] font-semibold tracking-tight text-ink">
            Your transfer
          </h1>
          <p className="mt-2 max-w-xl text-[0.95rem] text-body">
            All-inclusive prices, calculated instantly by distance. To change your
            route, date or time, tap Back.
          </p>
          <TripRecap pickup={pickupLabel} dropoff={dropoffLabel} date={date} time={time} />
        </div>

        {/* LEFT: large cards (3 visible per row) · RIGHT: map + sticky summary */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* EXPERIENCE — vehicle cards ONLY */}
            <div className="min-w-0">
              <h3 className="mb-5 text-[1.15rem] font-semibold tracking-tight text-ink">
                Choose your experience
              </h3>
              {/* Large cards, 3 per row (fills the column) — all categories
                  shown, none removed or shrunk to a thin strip. */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {VEHICLES.map((v) => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    distanceKm={distanceKm}
                    routeStatus={routeStatus}
                    selected={selectedVehicleId === v.id}
                    onSelect={setSelectedVehicleId}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT — map (≈440×330) on top + read-only summary under, sticky */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="h-[270px] w-full sm:h-[310px] lg:h-[330px]">
                <RouteMap
                  pickup={pickup}
                  dropoff={dropoff}
                  pickupText={pickupText}
                  dropoffText={dropoffText}
                  onRoute={setRoute}
                />
              </div>
              <BookingSummary
                pickupLabel={pickupLabel}
                dropoffLabel={dropoffLabel}
                date={date}
                time={time}
                distanceKm={distanceKm}
                durationText={durationText}
                routeStatus={routeStatus}
                vehicle={selectedVehicle}
              />
            </div>
        </div>
      </div>
    </div>
  );
}

// Read-only display of the trip entered in the hero — NOT editable inputs.
function TripRecap({ pickup, dropoff, date, time }) {
  if (!pickup && !dropoff && !date && !time) {
    return (
      <p className="mt-4 text-[0.82rem] text-muted">
        Enter your pickup, drop-off, date and time in the booking bar to preview
        your route.
      </p>
    );
  }
  const chip = (icon, text) => (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-line bg-surface px-3 py-1.5 text-[0.78rem] text-ink">
      {icon}
      <span className="truncate">{text || "—"}</span>
    </span>
  );
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {chip(<MapPin size={13} className="shrink-0 text-champ" />, pickup)}
      {chip(<Navigation size={13} className="shrink-0 text-champ" />, dropoff)}
      {chip(<Calendar size={13} className="shrink-0 text-champ" />, date)}
      {chip(<Clock size={13} className="shrink-0 text-champ" />, time)}
    </div>
  );
}
