// ─────────────────────────────────────────────────────────────────────────────
// VehicleCard — one selectable vehicle option.
//
// Desktop (≥1024px): tall vertical card, image ~75% of height, object-contain.
// Mobile/tablet: compact card sized for the swipe carousel. The renders are
// portrait 672×900 with the car in a middle band spanning nearly the full
// width, so the compact card crops VERTICALLY (object-cover + object-position)
// to trim dead beige while preserving the whole silhouette.
//
// Pricing/spec values are never derived here — they come from bookingPricing.js.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Users, Briefcase, Fuel, Cog } from "lucide-react";
import {
  calculatePrice, convertToEuro, formatCurrency, SELECTED_BORDER_COLOR,
} from "../../data/bookingPricing.js";

function Spec({ icon, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.76rem] text-muted lg:text-[0.78rem]">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

export default function VehicleCard({
  vehicle, distanceKm, durationText, routeStatus,
  selected, onSelect, disabled = false, disabledReason = null,
}) {
  const priceMad = calculatePrice(distanceKm, vehicle.pricePerKm);
  const priceEur = convertToEuro(priceMad);
  const isPrice = priceMad != null;
  const stateLabel = routeStatus === "error" ? "Price unavailable" : "Calculating…";

  const routeLine = distanceKm != null
    ? `${distanceKm} km${durationText ? ` · ${durationText}` : ""}`
    : null;

  const a11yLabel = [
    vehicle.name,
    vehicle.category,
    vehicle.model,
    `${vehicle.fuelType}, ${vehicle.transmission}`,
    `up to ${vehicle.maxPassengers} passengers`,
    `up to ${vehicle.maxBags} bags`,
    routeLine,
    isPrice ? formatCurrency(priceMad, "MAD") : stateLabel,
    disabled ? disabledReason : selected ? "selected" : "",
  ].filter(Boolean).join(", ");

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onSelect(vehicle.id)}
      disabled={disabled}
      aria-pressed={disabled ? undefined : selected}
      aria-disabled={disabled || undefined}
      aria-label={a11yLabel}
      whileHover={disabled ? undefined : { y: -6 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      animate={{
        boxShadow: selected && !disabled
          ? "0 0 0 2px #A9823F, 0 26px 50px -20px rgba(21,18,12,0.30)"
          : "0 6px 22px -12px rgba(21,18,12,0.14)",
      }}
      style={{ borderColor: selected && !disabled ? SELECTED_BORDER_COLOR : "#E7DECC" }}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 bg-surface text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champ lg:min-h-[360px] ${
        disabled ? "cursor-not-allowed opacity-55 grayscale" : ""
      }`}
    >
      {/* Image */}
      <div
        className="relative flex aspect-[4/3] shrink-0 items-center justify-center overflow-hidden md:aspect-auto md:h-[172px] lg:h-auto lg:flex-[3] lg:shrink"
        style={{
          background:
            "radial-gradient(ellipse at 58% 64%, #fffaf2 0%, #ede3d0 52%, #e0d4c0 100%)",
        }}
      >
        <img
          src={vehicle.image}
          alt={vehicle.name}
          width="672"
          height="900"
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover [object-position:center_54%] transition-transform duration-700 ease-out group-hover:scale-105 lg:object-contain lg:p-3 lg:[object-position:center_center]"
        />
        {selected && !disabled && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white"
            style={{ background: SELECTED_BORDER_COLOR }}
          >
            Selected
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5 lg:px-5 lg:py-4">
        <div className="min-w-0">
          <h4 className="truncate text-[0.98rem] font-semibold leading-tight text-ink lg:text-[1.05rem]">
            {vehicle.name}
          </h4>
          <p className="truncate text-[0.74rem] text-muted lg:text-[0.76rem]">
            {vehicle.category} · {vehicle.model}
          </p>
        </div>

        {/* 2-column spec grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Spec icon={<Fuel size={14} strokeWidth={1.8} className="shrink-0" />}>{vehicle.fuelType}</Spec>
          <Spec icon={<Cog size={14} strokeWidth={1.8} className="shrink-0" />}>{vehicle.transmission}</Spec>
          <Spec icon={<Users size={14} strokeWidth={1.8} className="shrink-0" />}>{vehicle.maxPassengers} seats</Spec>
          <Spec icon={<Briefcase size={14} strokeWidth={1.8} className="shrink-0" />}>{vehicle.maxBags} bags</Spec>
        </div>

        {/* Compact route line — "29.3 km · 29 min" */}
        {routeLine && (
          <p className="truncate text-[0.72rem] font-medium text-muted/90">{routeLine}</p>
        )}

        <div className="mt-auto">
          {disabled ? (
            <p className="text-[0.74rem] font-medium text-[#9a5b4d]">{disabledReason}</p>
          ) : isPrice ? (
            <motion.div
              key={priceMad}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-[1.05rem] font-semibold leading-none text-ink lg:text-[1.12rem]">
                {formatCurrency(priceMad, "MAD")}
              </span>
              <span className="text-[0.72rem] font-medium text-champ-dk">
                ≈ {formatCurrency(priceEur, "EUR")}
              </span>
            </motion.div>
          ) : (
            <div className="text-[0.74rem] font-medium italic text-muted">{stateLabel}</div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
