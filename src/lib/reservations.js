import { getSupabase } from "./supabase.js";

const TABLE = "reservations";
const PAGE_SIZE = 25;
const SELECT_COLUMNS = [
  "id", "created_at", "status", "client_name", "client_phone", "client_email",
  "pickup", "dropoff", "date", "time", "vehicle", "passengers", "luggage",
  "distance_km", "duration_text", "price_mad", "price_eur", "message",
].join(",");

export const STATUS = Object.freeze({ NEW: "New", CONFIRMED: "Confirmed", CANCELLED: "Cancelled" });
const ALLOWED_STATUS = new Set(Object.values(STATUS));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cleanText = (value, max) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

const cleanNumber = (value, min, max) => {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

function fromRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    pickup: row.pickup,
    dropoff: row.dropoff,
    date: row.date,
    time: row.time,
    vehicle: row.vehicle,
    passengers: row.passengers,
    luggage: row.luggage,
    distanceKm: row.distance_km,
    durationText: row.duration_text,
    priceMad: row.price_mad,
    priceEur: row.price_eur,
    message: row.message,
  };
}

function publicReservationRow(data) {
  const email = cleanText(data.clientEmail, 254)?.toLowerCase() ?? null;
  if (!cleanText(data.clientName, 120) || !cleanText(data.clientPhone, 40)) {
    throw new Error("Name and phone are required.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error("A valid email address is required.");
  }

  return {
    // Public callers can only create New requests. RLS repeats this validation.
    status: STATUS.NEW,
    client_name: cleanText(data.clientName, 120),
    client_phone: cleanText(data.clientPhone, 40),
    client_email: email,
    pickup: cleanText(data.pickup, 300),
    dropoff: cleanText(data.dropoff, 300),
    date: cleanText(data.date, 10),
    time: cleanText(data.time, 8),
    vehicle: cleanText(data.vehicle, 120),
    passengers: cleanNumber(data.passengers, 1, 50),
    luggage: cleanNumber(data.luggage, 0, 100),
    distance_km: cleanNumber(data.distanceKm, 0, 5000),
    duration_text: cleanText(data.durationText, 80),
    price_mad: cleanNumber(data.priceMad, 0, 1000000),
    price_eur: cleanNumber(data.priceEur, 0, 100000),
    message: cleanText(data.message, 5000),
  };
}

export async function getReservationsPage({ page = 0, pageSize = PAGE_SIZE } = {}) {
  const safePage = Math.max(0, Math.trunc(Number(page) || 0));
  const safeSize = Math.min(100, Math.max(10, Math.trunc(Number(pageSize) || PAGE_SIZE)));
  const from = safePage * safeSize;
  const to = from + safeSize - 1;

  const { data, count, error } = await getSupabase()
    .from(TABLE)
    .select(SELECT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { items: (data || []).map(fromRow), total: count || 0, page: safePage, pageSize: safeSize };
}

export async function getReservationAnalytics() {
  const { data, error } = await getSupabase().rpc("get_admin_reservation_analytics");
  if (error) throw error;
  return data;
}

export async function addReservation(data) {
  const payload = publicReservationRow(data);
  const request = getSupabase().from(TABLE).insert(payload);
  const generatedUrl = request.url?.toString() || "Unavailable";
  const { data: responseData, error, status, statusText } = await request;

  if (error) {
    const responseBody = error;
    console.groupCollapsed("[AFSAHI] Reservation insert failed");
    console.error("Request payload:", payload);
    console.error("Generated URL:", generatedUrl);
    console.error("Supabase error:", error);
    console.error("HTTP status:", status, statusText);
    console.error("Response body:", responseBody);
    console.groupEnd();

    const insertError = new Error(error.message || "Supabase reservation insert failed.", {
      cause: error,
    });
    insertError.name = "ReservationInsertError";
    insertError.requestPayload = payload;
    insertError.generatedUrl = generatedUrl;
    insertError.status = status;
    insertError.statusText = statusText;
    insertError.responseBody = responseBody;
    throw insertError;
  }

  return responseData;
}

export async function updateReservationStatus(id, status) {
  if (!UUID.test(id) || !ALLOWED_STATUS.has(status)) throw new Error("Invalid reservation update.");
  const { error } = await getSupabase().from(TABLE).update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteReservation(id) {
  if (!UUID.test(id)) throw new Error("Invalid reservation id.");
  const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export function reservationsToCSV(list) {
  const cols = [
    ["Created", (r) => r.createdAt], ["Status", (r) => r.status],
    ["Client name", (r) => r.clientName], ["Client phone", (r) => r.clientPhone],
    ["Client email", (r) => r.clientEmail], ["Pickup", (r) => r.pickup],
    ["Drop-off", (r) => r.dropoff], ["Date", (r) => r.date], ["Time", (r) => r.time],
    ["Vehicle", (r) => r.vehicle], ["Passengers", (r) => r.passengers],
    ["Luggage", (r) => r.luggage], ["Distance (km)", (r) => r.distanceKm],
    ["Duration", (r) => r.durationText], ["Price (MAD)", (r) => r.priceMad],
    ["Price (EUR)", (r) => r.priceEur], ["WhatsApp message", (r) => r.message],
  ];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    cols.map(([heading]) => escape(heading)).join(","),
    ...list.map((row) => cols.map(([, read]) => escape(read(row))).join(",")),
  ].join("\n");
}

export function downloadCSV(list) {
  const blob = new Blob(["\ufeff" + reservationsToCSV(list)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `afsahi-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
