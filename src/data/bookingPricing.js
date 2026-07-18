// ─────────────────────────────────────────────────────────────────────────────
// Booking vehicle catalogue + distance-based pricing engine (MAD primary, EUR derived).
//
//   priceMAD = round(distanceKm × pricePerKm)        e.g. 29.3 km × 11 = 322 MAD
//   priceEUR = priceMAD / EXCHANGE_RATE              e.g. 322 / 10.8 = €29.81
//
// Real driving distance comes from the OSRM route (never straight-line).
// This module is the ONLY source of vehicle specs + pricing — components must
// never re-derive a price.
// ─────────────────────────────────────────────────────────────────────────────
import { IMAGES } from "./images.js";

// ⬇️ EDIT VEHICLE LIST + PRICE PER KM (MAD) HERE
//
// This is the COMPLETE fleet — the booking flow offers exactly these five.
// fuelType / transmission reflect the standard chauffeur spec for each model;
// correct them here if a specific car in the fleet differs.
export const VEHICLES = [
  {
    id: "mercedes-eclass", name: "Mercedes E-Class", category: "Business",
    model: "E 220", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 3, maxBags: 2, pricePerKm: 11, image: IMAGES.fleetSedan,
  },
  {
    id: "skoda-superb", name: "Skoda Superb", category: "Premium Sedan",
    model: "Superb", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 3, maxBags: 3, pricePerKm: 8.5, image: IMAGES.fleetPremium,
  },
  {
    id: "skoda-kodiaq", name: "Skoda Kodiaq", category: "SUV",
    model: "Kodiaq", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 4, maxBags: 3, pricePerKm: 8.5, image: IMAGES.fleetSuv,
  },
  {
    id: "mercedes-vito", name: "Mercedes Vito", category: "Van",
    model: "Vito Tourer", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 7, maxBags: 6, pricePerKm: 11, image: IMAGES.fleetVanExec,
  },
  {
    // Same class and rate as the Vito — both MUST price identically for a given
    // route. Kept as a distinct option with its own name, image and specs.
    id: "ford-tourneo", name: "Ford Tourneo", category: "Van",
    model: "Tourneo Custom", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 7, maxBags: 6, pricePerKm: 11, image: IMAGES.fleetShuttle,
  },
  {
    id: "minibus", name: "Minibus", category: "Group Travel",
    model: "Sprinter", fuelType: "Diesel", transmission: "Automatic",
    maxPassengers: 19, maxBags: 20, pricePerKm: 20, image: IMAGES.fleetMinibus,
  },
];

export const DEFAULT_VEHICLE_ID = VEHICLES[0]?.id ?? null;

// Selector bounds — 1 passenger minimum, 0 bags minimum.
export const MAX_PASSENGERS = Math.max(...VEHICLES.map((v) => v.maxPassengers));
export const MAX_BAGS = Math.max(...VEHICLES.map((v) => v.maxBags));

// Flip this to "#C9A24B" (gold) to keep selection fully on-brand instead of blue.
export const SELECTED_BORDER_COLOR = "#A9823F";

// ⬇️ ADMIN: EDIT EXCHANGE RATE HERE (MAD per 1 EUR)
export const EXCHANGE_RATE = 10.8;

// ── Reusable pricing engine ──────────────────────────────────────────────────
// Round MAD to the nearest whole dirham (322.3 → 322).
export function roundPrice(mad) {
  return Math.round(mad);
}

// MAD price from real driving distance. Returns null when distance isn't ready.
export function calculatePrice(distanceKm, pricePerKm) {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  return roundPrice(distanceKm * pricePerKm);
}

// MAD → EUR, 2 decimals.
export function convertToEuro(priceMad) {
  if (priceMad == null) return null;
  return +(priceMad / EXCHANGE_RATE).toFixed(2);
}

// formatCurrency(322, "MAD") → "322 MAD" ; formatCurrency(29.81, "EUR") → "€29.81"
export function formatCurrency(value, currency = "MAD") {
  if (value == null) return null;
  return currency === "EUR" ? `€${value.toFixed(2)}` : `${value} MAD`;
}

// ── Capacity compatibility ───────────────────────────────────────────────────
export function isVehicleCompatible(vehicle, passengers, bags) {
  return vehicle.maxPassengers >= passengers && vehicle.maxBags >= bags;
}

// Compatible first (original order preserved), incompatible pushed to the bottom.
export function sortByCompatibility(vehicles, passengers, bags) {
  return [...vehicles].sort((a, b) => {
    const ca = isVehicleCompatible(a, passengers, bags) ? 0 : 1;
    const cb = isVehicleCompatible(b, passengers, bags) ? 0 : 1;
    return ca - cb;
  });
}

export function incompatibilityReason(vehicle, passengers, bags) {
  if (isVehicleCompatible(vehicle, passengers, bags)) return null;
  return `Not suitable for ${passengers} passenger${passengers > 1 ? "s" : ""} and ${bags} bag${bags === 1 ? "" : "s"}`;
}
