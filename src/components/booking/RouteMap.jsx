// ─────────────────────────────────────────────────────────────────────────────
// RouteMap — Leaflet + OpenStreetMap tiles + OSRM driving route.
// Key-less and free. Resolves each endpoint (selected place lat/lng, else the
// typed text via Nominatim), routes with OSRM, draws the polyline + markers,
// fits bounds, and lifts distance (km) + duration to the parent.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import {
  OSM_TILE_URL, OSM_ATTRIBUTION, MOROCCO_CENTER, DEFAULT_ZOOM,
  geocodeText, getRoute,
} from "../../lib/maps.js";

// Branded pin (avoids Leaflet's broken default-icon image imports under bundlers)
const pin = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #FCFAF5"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 16],
  });
const PIN_FROM = pin("#15120C");
const PIN_TO = pin("#A9823F");

// Imperatively fit the map to the route/markers whenever they change.
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
    // Leaflet needs a size recheck after the container settles.
    setTimeout(() => map.invalidateSize(), 60);
  }, [bounds, map]);
  return null;
}

export default function RouteMap({ pickup, dropoff, pickupText, dropoffText, onRoute }) {
  const [path, setPath] = useState(null);          // [[lat,lng], …]
  const [markers, setMarkers] = useState({ origin: null, dest: null });
  const [status, setStatus] = useState("idle");    // idle | loading | ok | error
  const onRouteRef = useRef(onRoute);
  onRouteRef.current = onRoute;

  const originSel = pickup?.lat != null ? { lat: pickup.lat, lng: pickup.lng } : null;
  const destSel = dropoff?.lat != null ? { lat: dropoff.lat, lng: dropoff.lng } : null;
  const oText = (pickupText || "").trim();
  const dText = (dropoffText || "").trim();
  const canRoute = !!(originSel || oText) && !!(destSel || dText);

  // Stable dependency key so the effect only re-runs on a real change.
  const key = JSON.stringify([originSel, destSel, oText, dText]);

  useEffect(() => {
    if (!canRoute) {
      setPath(null); setMarkers({ origin: null, dest: null }); setStatus("idle");
      onRouteRef.current?.({ distanceKm: null, durationText: null, status: "idle" });
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();
    (async () => {
      try {
        setStatus("loading");
        onRouteRef.current?.({ distanceKm: null, durationText: null, status: "loading" });
        const origin = originSel || (await geocodeText(oText, { signal: ctrl.signal }));
        const dest = destSel || (await geocodeText(dText, { signal: ctrl.signal }));
        if (!origin || !dest) throw new Error("GEOCODE_FAILED");
        const route = await getRoute(origin, dest, { signal: ctrl.signal });
        if (cancelled) return;
        setPath(route.path);
        setMarkers({ origin, dest });
        setStatus("ok");
        onRouteRef.current?.({ distanceKm: route.distanceKm, durationText: route.durationText, status: "ok" });
      } catch (err) {
        if (cancelled || err.name === "AbortError") return;
        setPath(null); setMarkers({ origin: null, dest: null }); setStatus("error");
        onRouteRef.current?.({ distanceKm: null, durationText: null, status: "error" });
      }
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const bounds =
    path?.length ? L.latLngBounds(path)
    : markers.origin && markers.dest ? L.latLngBounds([
        [markers.origin.lat, markers.origin.lng],
        [markers.dest.lat, markers.dest.lng],
      ])
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-[#e8eaed]">
      <MapContainer
        center={MOROCCO_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        zoomControl
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        {markers.origin && <Marker position={[markers.origin.lat, markers.origin.lng]} icon={PIN_FROM} />}
        {markers.dest && <Marker position={[markers.dest.lat, markers.dest.lng]} icon={PIN_TO} />}
        {path && <Polyline positions={path} pathOptions={{ color: "#A9823F", weight: 5, opacity: 0.9 }} />}
        <FitBounds bounds={bounds} />
      </MapContainer>

      <AnimatePresence>
        {!canRoute && (
          <motion.div key="empty"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-0 bottom-4 z-[1000] flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-full border border-line bg-white/95 px-4 py-2 shadow-[0_8px_24px_-10px_rgba(21,18,12,0.3)] backdrop-blur-sm">
              <MapPin size={15} strokeWidth={1.8} className="text-champ" />
              <span className="text-[0.78rem] font-medium text-ink">
                Add pickup &amp; drop-off to preview your route
              </span>
            </div>
          </motion.div>
        )}
        {canRoute && status === "loading" && (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/45 backdrop-blur-[2px]">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-champ/30 border-t-champ" />
            <p className="mt-3 text-[0.8rem] text-ink">Drawing route…</p>
          </motion.div>
        )}
        {canRoute && status === "error" && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur-[2px] p-6 text-center">
            <div className="max-w-[18rem] rounded-2xl border border-line bg-white p-5 shadow-[0_12px_30px_-12px_rgba(21,18,12,0.25)]">
              <p className="text-[0.88rem] font-semibold text-ink">No drivable route found</p>
              <p className="mt-1 text-[0.76rem] text-muted">
                We couldn&apos;t map a road route between these points. Try more
                specific addresses.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
