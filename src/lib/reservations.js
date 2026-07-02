// ─────────────────────────────────────────────────────────────────────────────
// Reservations store — SUPABASE (hosted Postgres, cross-device).
//
// Every client booking is INSERTed here, and the /admin dashboard reads,
// updates and deletes through this module. All functions are async.
//
// ── ONE-TIME SETUP ───────────────────────────────────────────────────────────
// Run this once in Supabase → SQL Editor (dashboard):
//
//   create table if not exists public.reservations (
//     id            uuid primary key default gen_random_uuid(),
//     created_at    timestamptz not null default now(),
//     status        text not null default 'New',
//     pickup        text,
//     dropoff       text,
//     date          text,
//     time          text,
//     vehicle       text,
//     passengers    int,
//     luggage       int,
//     distance_km   numeric,
//     duration_text text,
//     price_mad     numeric,
//     price_eur     numeric,
//     message       text
//   );
//   alter table public.reservations enable row level security;
//   create policy "anon insert" on public.reservations for insert to anon with check (true);
//   create policy "anon select" on public.reservations for select to anon using (true);
//   create policy "anon update" on public.reservations for update to anon using (true) with check (true);
//   create policy "anon delete" on public.reservations for delete to anon using (true);
//
// ⚠️ These policies allow anyone with the (public) anon key to read/modify the
// table — acceptable for launch, but for a hardened dashboard add Supabase
// Auth and restrict select/update/delete to authenticated admins.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "./supabase.js";

const TABLE = "reservations";

export const STATUS = { NEW: "New", CONFIRMED: "Confirmed", CANCELLED: "Cancelled" };

// DB rows are snake_case; the UI/analytics use camelCase. Map here so the rest
// of the app never changes when the storage layer does.
function fromRow(r) {
  return {
    id: r.id,
    createdAt: r.created_at,
    status: r.status,
    pickup: r.pickup,
    dropoff: r.dropoff,
    date: r.date,
    time: r.time,
    vehicle: r.vehicle,
    passengers: r.passengers,
    luggage: r.luggage,
    distanceKm: r.distance_km,
    durationText: r.duration_text,
    priceMad: r.price_mad,
    priceEur: r.price_eur,
    message: r.message,
  };
}

function toRow(d) {
  return {
    status: d.status ?? STATUS.NEW,
    pickup: d.pickup ?? null,
    dropoff: d.dropoff ?? null,
    date: d.date ?? null,
    time: d.time ?? null,
    vehicle: d.vehicle ?? null,
    passengers: d.passengers ?? null,
    luggage: d.luggage ?? null,
    distance_km: d.distanceKm ?? null,
    duration_text: d.durationText ?? null,
    price_mad: d.priceMad ?? null,
    price_eur: d.priceEur ?? null,
    message: d.message ?? null,
  };
}

// Newest first. Throws on network/table errors — callers show an error state.
export async function getReservations() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

// Called by the booking flow when the client taps Reserve (fire-and-forget
// there, so a storage hiccup can never block the WhatsApp booking).
export async function addReservation(data) {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .insert(toRow(data))
    .select()
    .single();
  if (error) throw error;
  return fromRow(rows);
}

export async function updateReservationStatus(id, status) {
  const { error } = await supabase.from(TABLE).update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteReservation(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ── CSV export (from Supabase data) ─────────────────────────────────────────
export function reservationsToCSV(list) {
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

export async function downloadCSV(list) {
  const data = list || (await getReservations());
  const blob = new Blob(["﻿" + reservationsToCSV(data)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `afsahi-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
