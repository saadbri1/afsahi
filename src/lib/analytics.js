// ─────────────────────────────────────────────────────────────────────────────
// Shared dashboard formatting helpers. Aggregate analytics are calculated in
// Postgres so the admin does not need to download the entire reservations table.
//
// REVENUE RULE: only CONFIRMED reservations count as revenue. New reservations
// are shown separately as "pending value"; cancelled never count.
//
// ─────────────────────────────────────────────────────────────────────────────
import { STATUS } from "./reservations.js";

const mad = (r) => Number(r.priceMad) || 0;
const confirmed = (list) => list.filter((r) => r.status === STATUS.CONFIRMED);

export function computeKpis(list) {
  const conf = confirmed(list);
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);   // YYYY-MM
  const todayKey = now.toISOString().slice(0, 10);  // YYYY-MM-DD

  const totalRevenue = conf.reduce((s, r) => s + mad(r), 0);
  const monthlyRevenue = conf
    .filter((r) => (r.createdAt || "").slice(0, 7) === monthKey)
    .reduce((s, r) => s + mad(r), 0);
  const todayRevenue = conf
    .filter((r) => (r.createdAt || "").slice(0, 10) === todayKey)
    .reduce((s, r) => s + mad(r), 0);

  const news = list.filter((r) => r.status === STATUS.NEW);
  return {
    totalRevenue,
    monthlyRevenue,
    todayRevenue,
    totalReservations: list.length,
    newCount: news.length,
    confirmedCount: conf.length,
    cancelledCount: list.filter((r) => r.status === STATUS.CANCELLED).length,
    avgBookingValue: conf.length ? Math.round(totalRevenue / conf.length) : 0,
    pendingValue: news.reduce((s, r) => s + mad(r), 0), // shown separately, never revenue
  };
}

// Last 6 months of confirmed revenue → [{ month: "Feb", revenue: 1690 }, …]
export function revenueByMonth(list, months = 6) {
  const conf = confirmed(list);
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    out.push({
      month: m.toLocaleString("en", { month: "short" }),
      revenue: conf
        .filter((r) => (r.createdAt || "").slice(0, 7) === key)
        .reduce((s, r) => s + mad(r), 0),
    });
  }
  return out;
}

export function reservationsByStatus(list) {
  return [
    { name: "New", value: list.filter((r) => r.status === STATUS.NEW).length, color: "#C9A86A" },
    { name: "Confirmed", value: list.filter((r) => r.status === STATUS.CONFIRMED).length, color: "#3f9c6b" },
    { name: "Cancelled", value: list.filter((r) => r.status === STATUS.CANCELLED).length, color: "#c0564a" },
  ].filter((s) => s.value > 0);
}

export function bookingsByVehicle(list) {
  const map = {};
  list.forEach((r) => {
    const v = r.vehicle || "—";
    map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map)
    .map(([vehicle, count]) => ({ vehicle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// Short place label: "Casablanca, Pachalik de…" → "Casablanca"
const shortPlace = (s) => (s || "—").split(",")[0].trim();

export function topRoutes(list, limit = 5) {
  const map = {};
  list.forEach((r) => {
    const key = `${shortPlace(r.pickup)} → ${shortPlace(r.dropoff)}`;
    if (!map[key]) map[key] = { route: key, count: 0, revenue: 0 };
    map[key].count += 1;
    if (r.status === STATUS.CONFIRMED) map[key].revenue += mad(r);
  });
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, limit);
}

export const fmtMAD = (n) => `${(Number(n) || 0).toLocaleString("en-US")} MAD`;
