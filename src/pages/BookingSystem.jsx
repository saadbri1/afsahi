// ─────────────────────────────────────────────────────────────────────────────
// BookingSystem — the OPTIONS page. Display + car choice ONLY.
//
// It enters NO trip details. Pickup, drop-off, date and time are entered once in
// the hero booking bar and read here from the shared BookingContext. This page
// renders the route map, distance, duration, vehicle cards (km-based price),
// booking summary and WhatsApp CTA — all sourced from that single state.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Calendar, Clock, Route } from "lucide-react";
import {
  VEHICLES, MAX_PASSENGERS, MAX_BAGS,
  isVehicleCompatible, sortByCompatibility, incompatibilityReason,
} from "../data/bookingPricing.js";
import { useBooking } from "../context/BookingContext.jsx";
import RouteMap from "../components/booking/RouteMap.jsx";
import VehicleCard from "../components/booking/VehicleCard.jsx";
import BookingSummary from "../components/booking/BookingSummary.jsx";

export default function BookingSystem({ onBack }) {
  const {
    pickup, dropoff, pickupText, dropoffText, date, time,
    distanceKm, durationText, routeStatus, setRoute,
    selectedVehicleId, setSelectedVehicleId,
    passengers, setPassengers, bags, setBags,
  } = useBooking();

  // Display strings — selected place address wins, else the manually typed text.
  const pickupLabel = pickup?.formattedAddress || pickup?.description || pickupText;
  const dropoffLabel = dropoff?.formattedAddress || dropoff?.description || dropoffText;

  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || null;
  const trackRef = useRef(null);

  // Compatible options first, incompatible pushed to the bottom (never hidden,
  // so the customer can see why a class isn't available).
  const orderedVehicles = sortByCompatibility(VEHICLES, passengers, bags);
  const compatibleVehicles = VEHICLES.filter((v) => isVehicleCompatible(v, passengers, bags));

  // If the party grows past the selected car, move to the first car that fits —
  // consistent with the flow already auto-selecting a default vehicle.
  useEffect(() => {
    if (!selectedVehicleId) return;
    const current = VEHICLES.find((v) => v.id === selectedVehicleId);
    if (current && !isVehicleCompatible(current, passengers, bags)) {
      setSelectedVehicleId(compatibleVehicles[0]?.id ?? null);
    }
  }, [passengers, bags, selectedVehicleId, compatibleVehicles, setSelectedVehicleId]);

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

      {/* pb clears the fixed WhatsApp button on mobile so the last card and the
          summary actions are never trapped underneath it */}
      <div className="mx-auto w-full max-w-[1320px] px-5 pb-28 pt-8 sm:px-8 lg:pb-12 lg:pt-8 lg:py-12">
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
          <TripRecap
            pickup={pickupLabel} dropoff={dropoffLabel} date={date} time={time}
            distanceKm={distanceKm} durationText={durationText}
          />
        </div>

        {/* LEFT: large cards (3 visible per row) · RIGHT: map + sticky summary */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* EXPERIENCE — vehicle cards ONLY */}
            <div className="min-w-0">
              <div className="mb-4 flex items-baseline justify-between gap-3 lg:mb-5">
                <h3 className="text-[1.15rem] font-semibold tracking-tight text-ink">
                  Choose your experience
                </h3>
                <span className="shrink-0 text-[0.76rem] text-muted">
                  {compatibleVehicles.length} of {VEHICLES.length} available
                </span>
              </div>

              {/* Party size — drives which vehicles are offered */}
              <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
                <CountSelect
                  id="passenger-count" label="Passengers" value={passengers}
                  onChange={setPassengers} min={1} max={MAX_PASSENGERS}
                />
                <CountSelect
                  id="bag-count" label="Bags" value={bags}
                  onChange={setBags} min={0} max={MAX_BAGS}
                />
                <p className="min-w-0 flex-1 text-[0.76rem] leading-5 text-muted">
                  {compatibleVehicles.length === 0
                    ? "No vehicle in the fleet fits this party. Reduce passengers or bags, or contact us for a multi-car transfer."
                    : `Showing vehicles that fit ${passengers} passenger${passengers > 1 ? "s" : ""} and ${bags} bag${bags === 1 ? "" : "s"}.`}
                </p>
              </div>
              {/* Mobile (<768px): native CSS scroll-snap carousel — one card in
                  view with the next peeking. Tablet/desktop: the same list
                  becomes a grid (2 per row, 3 on wide desktop). The negative
                  margin lets the track bleed to the screen edge while cards stay
                  aligned to the page gutter via scroll-padding. */}
              <div
                ref={trackRef}
                className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3 [&::-webkit-scrollbar]:hidden"
              >
                {orderedVehicles.map((v) => {
                  const reason = incompatibilityReason(v, passengers, bags);
                  return (
                    <div key={v.id} className="w-[82vw] shrink-0 snap-start md:w-auto md:shrink">
                      <VehicleCard
                        vehicle={v}
                        distanceKm={distanceKm}
                        durationText={durationText}
                        routeStatus={routeStatus}
                        selected={selectedVehicleId === v.id}
                        onSelect={setSelectedVehicleId}
                        disabled={Boolean(reason)}
                        disabledReason={reason}
                      />
                    </div>
                  );
                })}
              </div>

              <CarouselProgress trackRef={trackRef} total={VEHICLES.length} />
            </div>

            {/* RIGHT — desktop: map on top, summary under, sticky.
                Mobile: summary first (so the user can finish booking right after
                choosing a car) and the shorter map last. */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-24">
              <div className="order-2 h-[220px] w-full sm:h-[280px] lg:order-1 lg:h-[330px]">
                <RouteMap
                  pickup={pickup}
                  dropoff={dropoff}
                  pickupText={pickupText}
                  dropoffText={dropoffText}
                  onRoute={setRoute}
                />
              </div>
              <div className="order-1 lg:order-2">
                <BookingSummary
                  pickupLabel={pickupLabel}
                  dropoffLabel={dropoffLabel}
                  date={date}
                  time={time}
                  distanceKm={distanceKm}
                  durationText={durationText}
                  routeStatus={routeStatus}
                  vehicle={selectedVehicle}
                  passengers={passengers}
                  bags={bags}
                />
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Compact, fully accessible count picker (native select — keyboard + screen
// reader support for free, and it stays compact on mobile).
function CountSelect({ id, label, value, onChange, min, max }) {
  const options = [];
  for (let n = min; n <= max; n += 1) options.push(n);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 min-w-[5.5rem] rounded-xl border border-line bg-paper px-3 text-[0.88rem] font-medium text-ink transition-colors hover:border-champ/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champ"
      >
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

// Mobile carousel position — "02 / 07" with a thin gold progress line.
// Chosen over dots: it scales cleanly past 6 items and reads more editorial.
// Purely presentational (aria-hidden); the cards themselves carry the semantics.
function CarouselProgress({ trackRef, total }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let frame = 0;
    const measure = () => {
      const first = el.firstElementChild;
      if (!first) return;
      const step = first.getBoundingClientRect().width + 12; // card + gap
      if (step <= 0) return;
      setIndex(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / step))));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [trackRef, total]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="mt-4 flex items-center gap-4 md:hidden" aria-hidden="true">
      <span className="shrink-0 text-[0.7rem] font-semibold tracking-[0.14em] text-muted">
        <span className="text-ink">{pad(index + 1)}</span> / {pad(total)}
      </span>
      <span className="relative h-px flex-1 overflow-hidden bg-line">
        <span
          className="absolute inset-y-0 left-0 bg-champ transition-[width] duration-300 ease-out"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </span>
    </div>
  );
}

// Read-only display of the trip entered in the hero — NOT editable inputs.
function TripRecap({ pickup, dropoff, date, time, distanceKm, durationText }) {
  if (!pickup && !dropoff && !date && !time) {
    return (
      <p className="mt-4 text-[0.82rem] text-muted">
        Enter your pickup, drop-off, date and time in the booking bar to preview
        your route.
      </p>
    );
  }
  // Geocoded labels can be full administrative addresses ("Marrakech, Pachalik
  // de Marrakech, Préfecture de …"). On mobile show only the primary label so
  // the recap can't consume the screen; the full value stays available to
  // pointer + assistive tech via title/aria-label.
  const primary = (value) => (value ? String(value).split(",")[0].trim() : "");

  const chip = (icon, text) => {
    const full = text || "—";
    const short = primary(text) || "—";
    return (
      <span
        title={full}
        aria-label={full}
        className="inline-flex min-w-0 max-w-[48%] items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.78rem] text-ink lg:max-w-full"
      >
        {icon}
        <span className="truncate lg:hidden">{short}</span>
        <span className="hidden truncate lg:block">{full}</span>
      </span>
    );
  };
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {chip(<MapPin size={13} className="shrink-0 text-champ" />, pickup)}
      {chip(<Navigation size={13} className="shrink-0 text-champ" />, dropoff)}
      {chip(<Calendar size={13} className="shrink-0 text-champ" />, date)}
      {chip(<Clock size={13} className="shrink-0 text-champ" />, time)}
      {distanceKm != null && chip(
        <Route size={13} className="shrink-0 text-champ" />,
        `${distanceKm} km${durationText ? ` · ${durationText}` : ""}`
      )}
    </div>
  );
}
