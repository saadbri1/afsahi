// ─────────────────────────────────────────────────────────────────────────────
// Centralized WhatsApp helper. Every CTA on the site builds its wa.me URL here,
// so the number lives in one place (config/contact.js) and messages stay
// consistent. Always opened with target="_blank" + rel="noopener noreferrer".
// ─────────────────────────────────────────────────────────────────────────────
import { WHATSAPP_NUMBER } from "../config/contact.js";

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Generic CTA (no booking context yet) — hero, footer, floating button, etc.
export const SIMPLE_WHATSAPP_MESSAGE =
  "Bonjour AFSAHI, je souhaite réserver un trajet privé. Pouvez-vous me contacter ?";

// Full booking message — built from the shared booking state. Any missing field
// is omitted cleanly (no "undefined" lines). Price shown in MAD with EUR derived.
export function buildBookingMessage({
  clientName,
  clientPhone,
  clientEmail,
  pickup,
  dropoff,
  vehicle,
  distanceKm,
  priceMad,
  priceEur,
  date,
  time,
  passengers,
  luggage,
} = {}) {
  const lines = ["Hello AFSAHI Luxury Transport,", "I would like to book.", ""];
  if (clientName) lines.push(`Name: ${clientName}`);
  if (clientPhone) lines.push(`Phone: ${clientPhone}`);
  if (clientEmail) lines.push(`Email: ${clientEmail}`);
  if (pickup) lines.push(`Pickup: ${pickup}`);
  if (dropoff) lines.push(`Drop-off: ${dropoff}`);
  if (vehicle) lines.push(`Vehicle: ${vehicle}`);
  if (distanceKm != null) lines.push(`Distance: ${distanceKm} km`);
  if (priceMad != null) {
    lines.push(`Estimated Price: ${priceMad} MAD`);
    if (priceEur != null) lines.push(`≈ €${priceEur.toFixed(2)}`);
  }
  if (date) lines.push(`Date: ${date}`);
  if (time) lines.push(`Time: ${time}`);
  if (passengers != null) lines.push(`Passengers: ${passengers}`);
  if (luggage != null) lines.push(`Luggage: ${luggage}`);
  lines.push("", "Please confirm availability.");
  return lines.join("\n");
}
