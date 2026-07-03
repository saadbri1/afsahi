// ─────────────────────────────────────────────────────────────────────────────
// Free, key-less geo layer — NO Google Maps. Uses:
//   • OpenStreetMap raster tiles  (map)
//   • Nominatim                   (place search / geocoding)
//   • OSRM                        (driving route + distance + duration)
// All three are public, CORS-enabled and require zero cloud configuration.
// ─────────────────────────────────────────────────────────────────────────────

// Map defaults
export const MOROCCO_CENTER = [31.7917, -7.0926]; // [lat, lng] for Leaflet
export const DEFAULT_ZOOM = 6;

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM = "https://router.project-osrm.org/route/v1/driving";

// ── Nominatim place search (autocomplete + manual-entry geocoding) ───────────
// Returns [{ description, lat, lng, placeId }]. Biased toward Morocco but the
// query is global. `signal` lets callers cancel stale debounced requests.
export async function searchPlaces(query, { signal, limit = 6 } = {}) {
  const q = (query || "").trim();
  if (q.length < 2) return [];

  // 1. Instant local matches (major Moroccan cities + airports) — these appear
  //    even for short queries ("casa" → Casablanca) and never depend on the
  //    network or Nominatim's ranking.
  const local = matchMoroccoPlaces(q);

  // 2. Nominatim, two queries in parallel: Morocco-restricted (bias) + global
  //    (so international addresses still work). Morocco results rank first.
  const fetchNominatim = async (extra) => {
    const url =
      `${NOMINATIM}?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=${limit}&addressdetails=1&accept-language=en${extra}`;
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    return res.json();
  };

  let ma = [], global = [];
  if (q.length >= 3) {
    [ma, global] = await Promise.all([
      fetchNominatim("&countrycodes=ma").catch((e) => { if (e.name === "AbortError") throw e; return []; }),
      fetchNominatim("").catch((e) => { if (e.name === "AbortError") throw e; return []; }),
    ]);
  }

  const mapped = [...ma, ...global].map((p) => ({
    description: p.display_name,
    main: p.name || p.display_name.split(",")[0],
    secondary: p.display_name.split(",").slice(1).join(",").trim(),
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    placeId: String(p.place_id),
  }));

  // Merge: local shortlist first, then Nominatim; dedupe by id + rough position.
  const seen = new Set();
  const out = [];
  for (const item of [...local, ...mapped]) {
    const key = item.placeId + "|" + item.lat.toFixed(2) + "," + item.lng.toFixed(2);
    const posKey = item.main.toLowerCase() + "|" + item.lat.toFixed(1);
    if (seen.has(key) || seen.has(posKey)) continue;
    seen.add(key); seen.add(posKey);
    out.push(item);
    if (out.length >= limit + 2) break;
  }
  return out;
}

// ── Morocco shortlist — guarantees the key cities/airports always match ──────
const MOROCCO_PLACES = [
  { main: "Casablanca", secondary: "Morocco", lat: 33.5731, lng: -7.5898, aliases: ["casa"] },
  { main: "Aéroport Mohammed V (CMN)", secondary: "Casablanca · Airport", lat: 33.3675, lng: -7.5899, aliases: ["cmn", "mohammed v", "casablanca airport", "aeroport casablanca"] },
  { main: "Rabat", secondary: "Morocco", lat: 34.0209, lng: -6.8416, aliases: [] },
  { main: "Aéroport Rabat–Salé (RBA)", secondary: "Rabat · Airport", lat: 34.0515, lng: -6.7515, aliases: ["rba", "rabat airport", "sale"] },
  { main: "Marrakech", secondary: "Morocco", lat: 31.6295, lng: -7.9811, aliases: ["marrakesh", "kech"] },
  { main: "Aéroport Marrakech–Ménara (RAK)", secondary: "Marrakech · Airport", lat: 31.6069, lng: -8.0363, aliases: ["rak", "menara", "marrakech airport"] },
  { main: "Agadir", secondary: "Morocco", lat: 30.4278, lng: -9.5981, aliases: [] },
  { main: "Aéroport Agadir–Al Massira (AGA)", secondary: "Agadir · Airport", lat: 30.325, lng: -9.4131, aliases: ["aga", "al massira", "agadir airport"] },
  { main: "Tanger", secondary: "Morocco", lat: 35.7595, lng: -5.834, aliases: ["tangier", "tanger med"] },
  { main: "Aéroport Tanger–Ibn Battouta (TNG)", secondary: "Tanger · Airport", lat: 35.7269, lng: -5.9168, aliases: ["tng", "ibn battouta", "tanger airport"] },
  { main: "Fès", secondary: "Morocco", lat: 34.0331, lng: -5.0003, aliases: ["fes", "fez"] },
  { main: "Aéroport Fès–Saïss (FEZ)", secondary: "Fès · Airport", lat: 33.9273, lng: -4.978, aliases: ["fez airport", "saiss"] },
  { main: "Essaouira", secondary: "Morocco", lat: 31.5085, lng: -9.7595, aliases: [] },
  { main: "Ouarzazate", secondary: "Morocco", lat: 30.9189, lng: -6.8934, aliases: [] },
  { main: "Meknès", secondary: "Morocco", lat: 33.8935, lng: -5.5473, aliases: ["meknes"] },
  { main: "El Jadida", secondary: "Morocco", lat: 33.2316, lng: -8.5007, aliases: [] },
  { main: "Kénitra", secondary: "Morocco", lat: 34.261, lng: -6.5802, aliases: ["kenitra"] },
  { main: "Chefchaouen", secondary: "Morocco", lat: 35.1688, lng: -5.2636, aliases: ["chaouen"] },
];

function matchMoroccoPlaces(q) {
  const s = q.toLowerCase().trim();
  return MOROCCO_PLACES.filter((p) => {
    const names = [p.main.toLowerCase(), ...(p.aliases || [])];
    return names.some((n) => n.startsWith(s) || (s.length >= 3 && n.includes(s)));
  }).slice(0, 4).map((p) => ({
    description: `${p.main}, ${p.secondary}`,
    main: p.main,
    secondary: p.secondary,
    lat: p.lat,
    lng: p.lng,
    placeId: `ma-${p.main.toLowerCase().replace(/[^a-z]/g, "")}`,
  }));
}

// Geocode free text to a single { lat, lng } or null — shortlist first, then
// Morocco-biased Nominatim, then global.
export async function geocodeText(text, opts = {}) {
  const results = await searchPlaces(text, { ...opts, limit: 1 });
  return results[0] ? { lat: results[0].lat, lng: results[0].lng } : null;
}

// ── OSRM driving route ───────────────────────────────────────────────────────
// origin/dest are { lat, lng }. Returns { distanceKm, durationText, path }
// where path is [[lat,lng], …] for a Leaflet <Polyline>.
export async function getRoute(origin, dest, { signal } = {}) {
  const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const url = `${OSRM}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(data.code || "NO_ROUTE");
  }
  const route = data.routes[0];
  return {
    distanceKm: +(route.distance / 1000).toFixed(1),
    durationText: formatDuration(route.duration),
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

export function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
