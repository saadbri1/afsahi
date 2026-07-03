// ─────────────────────────────────────────────────────────────────────────────
// Booking vehicle catalogue + distance-based pricing engine (MAD primary, EUR derived).
//
//   priceMAD = round10(distanceKm × pricePerKm)      e.g. 30 km × 18.3 = 549 → 550 MAD
//   priceEUR = priceMAD / EXCHANGE_RATE              e.g. 550 / 10.8 = €50.93
//
// Real driving distance comes from the OSRM route (never straight-line).
// Images reuse the existing AFSAHI fleet renders (one distinct image per vehicle).
// ─────────────────────────────────────────────────────────────────────────────
import { IMAGES } from "./images.js";

// ⬇️ EDIT VEHICLE LIST + PRICE PER KM (MAD) HERE
// Premium black chauffeur fleet only (Economy / white Skoda Superb removed).
export const VEHICLES = [
  { id: "mercedes-eclass",       name: "Mercedes E-Class",      category: "Business",    image: IMAGES.fleetSedan,   pricePerKm: 18.3, passengers: 3,  luggage: 2 },
  { id: "mercedes-sclass",       name: "Mercedes S-Class",      category: "First Class", image: IMAGES.fleetFirst,   pricePerKm: 25,   passengers: 3,  luggage: 2 },
  { id: "skoda-kodiaq",          name: "Skoda Kodiaq",          category: "SUV",         image: IMAGES.fleetSuv,     pricePerKm: 15,   passengers: 4,  luggage: 3 },
  { id: "mercedes-vito",         name: "Mercedes Vito",         category: "Van",         image: IMAGES.fleetVanExec, pricePerKm: 20,   passengers: 7,  luggage: 6 },
  { id: "ford-tourneo",          name: "Ford Tourneo",          category: "Van",         image: "/images/vehicles/business-van-real.png", pricePerKm: 20, passengers: 7, luggage: 6 },
  { id: "mercedes-vclass",       name: "Mercedes V-Class",      category: "Van",         image: IMAGES.fleetVan,     pricePerKm: 20,   passengers: 7,  luggage: 6 },
  { id: "mercedes-sprinter-vip", name: "Mercedes Sprinter VIP", category: "VIP",         image: IMAGES.fleetMinibus, pricePerKm: 83.3, passengers: 19, luggage: 20 },
];

// Flip this to "#C9A24B" (gold) to keep selection fully on-brand instead of blue.
export const SELECTED_BORDER_COLOR = "#1D6BFF";

// ⬇️ ADMIN: EDIT EXCHANGE RATE HERE (MAD per 1 EUR)
export const EXCHANGE_RATE = 10.8;

// ── Reusable pricing engine ──────────────────────────────────────────────────
// Round MAD to the nearest 10 (381 → 380, 386 → 390).
export function roundPrice(mad) {
  return Math.round(mad / 10) * 10;
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

// formatCurrency(550, "MAD") → "550 MAD" ; formatCurrency(50.93, "EUR") → "€50.93"
export function formatCurrency(value, currency = "MAD") {
  if (value == null) return null;
  return currency === "EUR" ? `€${value.toFixed(2)}` : `${value} MAD`;
}
