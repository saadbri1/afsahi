// ─────────────────────────────────────────────────────────────────────────────
// FloatingWhatsApp — fixed, site-wide WhatsApp button (bottom-right).
// Premium gold-ringed green pill, gentle hover scale (transform only), a soft
// pulse that respects prefers-reduced-motion. Opens the generic WhatsApp chat.
// ─────────────────────────────────────────────────────────────────────────────
import { buildWhatsAppUrl, SIMPLE_WHATSAPP_MESSAGE } from "../lib/whatsapp.js";

function WaGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

export default function FloatingWhatsApp() {
  return (
    <a
      href={buildWhatsAppUrl(SIMPLE_WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact AFSAHI on WhatsApp"
      className="group fixed bottom-[max(0.9rem,env(safe-area-inset-bottom))] right-4 z-[60] block sm:bottom-6 sm:right-6"
    >
      <span
        className="relative grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-2 ring-champ/60 ring-offset-2 ring-offset-transparent transition-transform duration-300 ease-luxe group-hover:scale-105 group-active:scale-95 sm:h-14 sm:w-14"
      >
        <span className="whatsapp-pulse absolute inset-0 -z-10 rounded-full bg-[#25D366]/35" />
        <WaGlyph />
      </span>
    </a>
  );
}
