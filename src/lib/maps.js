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
  if (q.length < 3) return [];
  const url =
    `${NOMINATIM}?format=jsonv2&q=${encodeURIComponent(q)}` +
    `&limit=${limit}&addressdetails=1&accept-language=en`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  return (data || []).map((p) => ({
    description: p.display_name,
    main: p.name || p.display_name.split(",")[0],
    secondary: p.display_name.split(",").slice(1).join(",").trim(),
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    placeId: String(p.place_id),
  }));
}

// Geocode a free-text address to a single { lat, lng } (first match) or null.
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
