// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboard — /admin — owner login + reservations dashboard.
//
// ⚠️ SECURITY (read before shipping to a real client):
// This is a SIMPLE FRONTEND admin. Credentials come from VITE_* env vars, which
// are bundled into the public JS — a determined visitor can extract them, and
// the reservation data itself lives in localStorage (this browser only).
// It is fine as a demo / owner-preview, but it is NOT real security.
// For production: move reservations to Supabase (or Firebase), protect them
// with Supabase Auth + row-level security, and delete this login. The UI below
// is storage-agnostic so only src/lib/reservations.js needs replacing.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, LogOut, Download, Trash2, CheckCircle2, XCircle,
  MapPin, Navigation, Users, Briefcase, MessageCircle, Inbox, RefreshCw,
} from "lucide-react";
import Logo, { Wordmark } from "../components/Logo.jsx";
import {
  getReservations, updateReservationStatus, deleteReservation, downloadCSV, STATUS,
} from "../lib/reservations.js";

// Demo credentials — override via .env (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD).
const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME || "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || "change_this_password";
const SESSION_KEY = "afsahi_admin_session";

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  return authed
    ? <Dashboard onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }} />
    : <Login onSuccess={() => { sessionStorage.setItem(SESSION_KEY, "1"); setAuthed(true); }} />;
}

/* ── Login ─────────────────────────────────────────────────────────────────── */
function Login({ onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) onSuccess();
    else setError("Incorrect username or password.");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-noir px-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] rounded-3xl border border-champ/25 bg-[#1d1913] p-9 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-cream">
          <Logo size={40} />
          <Wordmark />
          <p className="mt-1 flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-champ-lt">
            <Lock size={11} /> Admin access
          </p>
        </div>

        <Field label="Username" type="text" value={user} onChange={setUser} autoFocus />
        <Field label="Password" type="password" value={pass} onChange={setPass} />

        {error && (
          <p className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-center text-[0.78rem] text-red-300">
            {error}
          </p>
        )}

        <button type="submit"
          className="w-full rounded-xl bg-champ px-6 py-3.5 text-[0.82rem] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-champ-lt">
          Sign in
        </button>
        <p className="mt-5 text-center text-[0.66rem] leading-relaxed text-cream/35">
          Frontend demo login — for a production dashboard, connect Supabase Auth.
        </p>
      </motion.form>
    </div>
  );
}

function Field({ label, type, value, onChange, autoFocus }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cream/45">{label}</span>
      <input
        type={type} value={value} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream/15 bg-noir px-4 py-3 text-[0.9rem] text-cream outline-none transition-colors focus:border-champ"
      />
    </label>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  [STATUS.NEW]:       "bg-champ/15 text-champ-dk border-champ/30",
  [STATUS.CONFIRMED]: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  [STATUS.CANCELLED]: "bg-red-500/10 text-red-600 border-red-500/25",
};

function Dashboard({ onLogout }) {
  const [items, setItems] = useState([]);
  const refresh = useCallback(() => setItems(getReservations()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const setStatus = (id, status) => { updateReservationStatus(id, status); refresh(); };
  const remove = (id) => {
    if (window.confirm("Delete this reservation permanently?")) { deleteReservation(id); refresh(); }
  };

  const counts = {
    total: items.length,
    new: items.filter((r) => r.status === STATUS.NEW).length,
    confirmed: items.filter((r) => r.status === STATUS.CONFIRMED).length,
    cancelled: items.filter((r) => r.status === STATUS.CANCELLED).length,
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-noir">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5">
          <div className="flex items-center gap-3 text-cream">
            <Logo size={30} />
            <span className="text-[0.82rem] font-semibold tracking-wide">Reservations dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} title="Refresh"
              className="grid h-9 w-9 place-items-center rounded-full border border-cream/15 text-cream/60 transition-colors hover:border-champ hover:text-champ">
              <RefreshCw size={14} />
            </button>
            <button onClick={downloadCSV}
              className="inline-flex items-center gap-2 rounded-full border border-champ/50 px-4 py-2 text-[0.74rem] font-semibold text-champ-lt transition-colors hover:bg-champ hover:text-white">
              <Download size={13} /> Export CSV
            </button>
            <button onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-4 py-2 text-[0.74rem] font-semibold text-cream/60 transition-colors hover:border-cream/40 hover:text-cream">
              <LogOut size={13} /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-5 py-8">
        {/* stat chips */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={counts.total} />
          <Stat label="New" value={counts.new} accent />
          <Stat label="Confirmed" value={counts.confirmed} />
          <Stat label="Cancelled" value={counts.cancelled} />
        </div>

        {/* demo-storage notice */}
        <p className="mb-6 rounded-xl border border-champ/25 bg-sand px-4 py-3 text-[0.76rem] leading-relaxed text-body">
          <strong className="text-ink">Demo storage:</strong> reservations are saved in this browser's
          localStorage only — bookings made on clients' own devices won't appear here. For a live
          dashboard, connect Supabase or Firebase (the code is already structured for that swap).
        </p>

        {items.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-line bg-surface py-24 text-center">
            <Inbox size={30} strokeWidth={1.4} className="text-champ" />
            <p className="mt-4 text-[1rem] font-semibold text-ink">No reservations yet</p>
            <p className="mt-1 max-w-sm text-[0.82rem] text-muted">
              When a client taps "Reserve via WhatsApp", the booking is captured here first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((r) => (
                <motion.article
                  key={r.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-[0_2px_14px_-8px_rgba(21,18,12,0.12)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] ${STATUS_STYLE[r.status] || ""}`}>
                        {r.status}
                      </span>
                      <span className="text-[0.72rem] text-muted">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Action title="Mark confirmed" onClick={() => setStatus(r.id, STATUS.CONFIRMED)}
                        className="text-emerald-600 hover:bg-emerald-500/10"><CheckCircle2 size={16} /></Action>
                      <Action title="Mark cancelled" onClick={() => setStatus(r.id, STATUS.CANCELLED)}
                        className="text-red-500 hover:bg-red-500/10"><XCircle size={16} /></Action>
                      <Action title="Delete" onClick={() => remove(r.id)}
                        className="text-muted hover:bg-line/60"><Trash2 size={15} /></Action>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-x-8 gap-y-2 text-[0.84rem] text-body sm:grid-cols-2">
                    <Cell icon={<MapPin size={13} className="text-champ" />} label="Pickup" value={r.pickup} />
                    <Cell icon={<Navigation size={13} className="text-champ" />} label="Drop-off" value={r.dropoff} />
                    <Cell label="Date" value={r.date} />
                    <Cell label="Time" value={r.time} />
                    <Cell label="Vehicle" value={r.vehicle} />
                    <Cell icon={<Users size={13} className="text-champ" />} label="Pax · Bags"
                      value={r.passengers != null ? `${r.passengers} · ${r.luggage}` : null} />
                    <Cell label="Distance" value={r.distanceKm != null ? `${r.distanceKm} km` : null} />
                    <Cell label="Duration" value={r.durationText} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <p className="text-[1.05rem] font-bold text-ink">
                      {r.priceMad != null ? `${r.priceMad} MAD` : "—"}
                      {r.priceEur != null && (
                        <span className="ml-2 text-[0.8rem] font-medium text-champ-dk">≈ €{Number(r.priceEur).toFixed(2)}</span>
                      )}
                    </p>
                    {r.message && (
                      <details className="min-w-0 max-w-full">
                        <summary className="flex cursor-pointer items-center gap-1.5 text-[0.74rem] font-semibold text-champ-dk hover:text-champ">
                          <MessageCircle size={13} /> Client WhatsApp message
                        </summary>
                        <pre className="mt-2 max-w-[60ch] whitespace-pre-wrap rounded-xl bg-sand p-3 text-[0.72rem] leading-relaxed text-body">{r.message}</pre>
                      </details>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-champ/40 bg-champ/10" : "border-line bg-surface"}`}>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-[1.6rem] font-bold leading-none text-ink">{value}</p>
    </div>
  );
}

function Action({ title, onClick, className, children }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${className}`}>
      {children}
    </button>
  );
}

function Cell({ icon, label, value }) {
  return (
    <p className="flex min-w-0 items-baseline gap-2">
      <span className="flex shrink-0 items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {icon} {label}
      </span>
      <span className="min-w-0 truncate">{value || "—"}</span>
    </p>
  );
}
