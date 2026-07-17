// ─────────────────────────────────────────────────────────────────────────────
// Destination city cards — REAL photography only (no AI renders).
//
// Each photo is an authentic, freely-licensed image of the actual city,
// downloaded from Wikimedia Commons into /public/images/cities/. One distinct
// image per city. Credits (CC BY-SA / CC BY — keep attribution if you publish
// a photo-credits page or footer):
//   • Casablanca — Hassan II Mosque       · Wikimedia Commons
//   • Marrakech  — Koutoubia Mosque        · Wikimedia Commons
//   • Tanger     — Tangier bay / medina    · Wikimedia Commons
//   • Rabat      — Hassan Tower · Petar Milošević / CC BY-SA · Wikimedia Commons
//   • Agadir     — Coast from Kasbah of Agadir Oufella · Wikimedia Commons
//
// To swap in your own licensed photos, drop a file at the same path.
// ─────────────────────────────────────────────────────────────────────────────
export const CITIES = [
  { name: "Casablanca", airport: "CMN · Mohammed V",  img: "/images/optimized/cities/casablanca.webp", width: 960, height: 730 },
  { name: "Marrakech",  airport: "RAK · Ménara",      img: "/images/optimized/cities/marrakech.webp", width: 960, height: 1280 },
  { name: "Tanger",     airport: "TNG · Ibn Battouta", img: "/images/optimized/cities/tanger.webp", width: 908, height: 498 },
  { name: "Rabat",      airport: "RBA · Salé",         img: "/images/optimized/cities/rabat.webp", width: 960, height: 1313 },
  { name: "Agadir",     airport: "AGA · Al Massira",   img: "/images/optimized/cities/agadir.webp", width: 960, height: 720 },
];
