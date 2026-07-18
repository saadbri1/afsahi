// ─────────────────────────────────────────────────────────────────────────────
// BookingContext — the SINGLE source of truth for the whole booking flow.
//
// Trip details are entered ONCE (in the hero) and read everywhere else (the
// options-page map, route, distance, duration, prices, summary, WhatsApp).
// The map stack is now key-less (OpenStreetMap + Nominatim + OSRM), so there is
// no API loader to wait on.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useCallback } from "react";
import { DEFAULT_VEHICLE_ID } from "../data/bookingPricing.js";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // ── Shared trip state (declared once, above hero + options) ──────────────
  const [pickup, setPickup] = useState(null);        // { description, lat, lng, placeId } | null
  const [dropoff, setDropoff] = useState(null);
  const [pickupText, setPickupText] = useState("");   // raw typed text (manual-entry fallback)
  const [dropoffText, setDropoffText] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [distanceKm, setDistanceKm] = useState(null); // derived from the OSRM route
  const [durationText, setDurationText] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle"); // idle | loading | ok | error
  const [selectedVehicleId, setSelectedVehicleId] = useState(DEFAULT_VEHICLE_ID);

  // Party size — drives which vehicles are offered. 1+ passengers, 0+ bags.
  const [passengers, setPassengers] = useState(1);
  const [bags, setBags] = useState(0);

  const setRoute = useCallback(({ distanceKm, durationText, status }) => {
    setDistanceKm(distanceKm ?? null);
    setDurationText(durationText ?? null);
    if (status) setRouteStatus(status);
  }, []);

  const resetTrip = useCallback(() => {
    setPickup(null); setDropoff(null); setPickupText(""); setDropoffText("");
    setDate(""); setTime(""); setDistanceKm(null); setDurationText(null);
    setRouteStatus("idle");
  }, []);

  const value = {
    pickup, setPickup,
    dropoff, setDropoff,
    pickupText, setPickupText,
    dropoffText, setDropoffText,
    date, setDate,
    time, setTime,
    distanceKm, durationText, routeStatus, setRoute,
    selectedVehicleId, setSelectedVehicleId,
    passengers, setPassengers,
    bags, setBags,
    resetTrip,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
