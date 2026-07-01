// ─────────────────────────────────────────────────────────────────────────────
// ⬇️ EDIT BUSINESS CONTACT DETAILS HERE
// Single source of truth for AFSAHI's contact + social details.
// Import from here everywhere — never hardcode the number/email in components.
// ─────────────────────────────────────────────────────────────────────────────

// WhatsApp / phone — digits only for wa.me, formatted for display, tel: link.
// Optionally overridden by the VITE_WHATSAPP_NUMBER env var (see .env.example);
// falls back to the value below so the site works with zero env configuration.
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "212660682895";
export const PHONE_DISPLAY = "+212 660-682895";
export const PHONE_TEL = "+212660682895";

export const EMAIL = "afsahi97@gmail.com";

export const INSTAGRAM_URL =
  "https://www.instagram.com/transfertoursmaroc1?igsh=MXF0dm1vNGd2cG5ucQ==";
export const FACEBOOK_URL =
  "https://www.facebook.com/share/19sbVfbZ88/?mibextid=wwXIfr";

export const CITY = "Casablanca · Morocco";
