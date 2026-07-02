// ─────────────────────────────────────────────────────────────────────────────
// Reservations store — DEMO / LOCAL VERSION ONLY.
//
// ⚠️ This uses the browser's localStorage, which means:
//   • Reservations are saved on THIS device/browser only.
//   • The admin sees reservations made in the same browser — clients' bookings
//     from their own phones do NOT appear here.
//   • Clearing browser data erases everything.
//
// FOR A REAL CLIENT DASHBOARD: replace this module with a hosted database +
// auth — Supabase (recommended: free tier, Postgres, row-level security,
// built-in email/password auth) or Firebase. The function signatures below are
// deliberately backend-shaped (get/add/update/remove) so swapping the storage
// layer later requires no changes to the dashboard UI.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "afsahi_reservations";

export const STATUS = { NEW: "New", CONFIRMED: "Confirmed", CANCELLED: "Cancelled" };

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function getReservations() {
  // newest first
  return read().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

// Called by the booking flow just BEFORE WhatsApp opens.
export function addReservation(data) {
  const item = {
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: STATUS.NEW,
    createdAt: new Date().toISOString(),
    ...data,
  };
  write([...read(), item]);
  return item;
}

export function updateReservationStatus(id, status) {
  return write(read().map((r) => (r.id === id ? { ...r, status } : r)));
}

export function deleteReservation(id) {
  return write(read().filter((r) => r.id !== id));
}

// CSV export of every stored reservation.
export function reservationsToCSV(list = getReservations()) {
  const cols = [
    ["Created", (r) => r.createdAt],
    ["Status", (r) => r.status],
    ["Pickup", (r) => r.pickup],
    ["Drop-off", (r) => r.dropoff],
    ["Date", (r) => r.date],
    ["Time", (r) => r.time],
    ["Vehicle", (r) => r.vehicle],
    ["Passengers", (r) => r.passengers],
    ["Luggage", (r) => r.luggage],
    ["Distance (km)", (r) => r.distanceKm],
    ["Duration", (r) => r.durationText],
    ["Price (MAD)", (r) => r.priceMad],
    ["Price (EUR)", (r) => r.priceEur],
    ["WhatsApp message", (r) => r.message],
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = cols.map(([h]) => esc(h)).join(",");
  const rows = list.map((r) => cols.map(([, fn]) => esc(fn(r))).join(","));
  return [head, ...rows].join("\n");
}

export function downloadCSV() {
  const blob = new Blob(["﻿" + reservationsToCSV()], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `afsahi-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
