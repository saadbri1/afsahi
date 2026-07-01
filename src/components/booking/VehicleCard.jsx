// ─────────────────────────────────────────────────────────────────────────────
// VehicleCard — large vertical Blacklane-style card.
// Image occupies ~70% of card height; price + pax/luggage below.
// Shows "Calculating…" until the route distance exists; then recomputes.
// ─────────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Users, Briefcase } from "lucide-react";
import {
  calculatePrice, convertToEuro, formatCurrency, SELECTED_BORDER_COLOR,
} from "../../data/bookingPricing.js";

export default function VehicleCard({ vehicle, distanceKm, routeStatus, selected, onSelect }) {
  const priceMad = calculatePrice(distanceKm, vehicle.pricePerKm);
  const priceEur = convertToEuro(priceMad);
  const isPrice = priceMad != null;
  const stateLabel = routeStatus === "error" ? "Price unavailable" : "Calculating…";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(vehicle.id)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      animate={{
        boxShadow: selected
          ? "0 0 0 2px #1D6BFF, 0 26px 50px -20px rgba(21,18,12,0.30)"
          : "0 6px 22px -12px rgba(21,18,12,0.14)",
      }}
      style={{ borderColor: selected ? SELECTED_BORDER_COLOR : "#E7DECC" }}
      className="group flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-3xl border-2 bg-surface text-left transition-colors duration-200"
    >
      {/* Image — ~75% of the card height, car fully visible (object-contain) */}
      <div
        className="relative flex flex-[3] items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 58% 64%, #fffaf2 0%, #ede3d0 52%, #e0d4c0 100%)",
        }}
      >
        <img
          src={vehicle.image}
          alt={vehicle.name}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {selected && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white"
            style={{ background: SELECTED_BORDER_COLOR }}
          >
            Selected
          </span>
        )}
      </div>

      {/* Content — ~25% */}
      <div className="flex flex-1 flex-col justify-between gap-3 px-5 py-4">
        <div>
          <h4 className="text-[1.05rem] font-semibold leading-tight text-ink">
            {vehicle.name}
          </h4>
          <p className="text-[0.76rem] text-muted">{vehicle.category}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[0.8rem] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} strokeWidth={1.8} />
              {vehicle.passengers}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase size={15} strokeWidth={1.8} />
              {vehicle.luggage}
            </span>
          </div>
          <div className="text-right">
            {isPrice ? (
              <motion.div
                key={priceMad}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-[1.12rem] font-semibold leading-none text-ink">
                  {formatCurrency(priceMad, "MAD")}
                </div>
                <div className="mt-1 text-[0.72rem] font-medium text-champ-dk">
                  ≈ {formatCurrency(priceEur, "EUR")}
                </div>
              </motion.div>
            ) : (
              <div className="text-[0.74rem] font-medium italic text-muted">
                {stateLabel}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
