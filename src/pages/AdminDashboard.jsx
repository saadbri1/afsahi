// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboard — /admin — owner login + premium analytics dashboard.
// Layout: dark sidebar (nav) · top header (profile) · Overview / Reservations.
//
// Data and authorization: Supabase Auth + Postgres Row Level Security.
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import {
  Lock, LogOut, LayoutDashboard, CalendarRange, UserRound, Crown,
} from "lucide-react";
import Logo, { Wordmark } from "../components/Logo.jsx";
import {
  getReservationsPage, getReservationAnalytics, updateReservationStatus, deleteReservation,
} from "../lib/reservations.js";
import {
  getAuthorizedAdmin, onAdminAuthChange, signInAdmin, signOutAdmin,
} from "../lib/adminAuth.js";

const Overview = lazy(() => import("../components/admin/Overview.jsx"));
const ReservationsTable = lazy(() => import("../components/admin/ReservationsTable.jsx"));
const PAGE_SIZE = 25;

export default function AdminDashboard() {
  const [auth, setAuth] = useState({ status: "checking", user: null, configurationError: false });

  const verify = useCallback(async () => {
    try {
      const result = await getAuthorizedAdmin();
      setAuth({
        status: result.authorized ? "authorized" : "login",
        user: result.authorized ? result.user : null,
        configurationError: Boolean(result.configurationError),
      });
    } catch (error) {
      console.error("[AFSAHI] Admin session verification failed:", error);
      setAuth({ status: "login", user: null, configurationError: false });
    }
  }, []);

  useEffect(() => {
    verify();
    return onAdminAuthChange((event) => {
      if (event === "SIGNED_OUT") setAuth({ status: "login", user: null, configurationError: false });
    });
  }, [verify]);

  if (auth.status === "checking") return <AdminLoading label="Verifying secure session…" />;
  if (auth.status === "authorized") {
    return (
      <Shell
        user={auth.user}
        onLogout={async () => {
          await signOutAdmin();
          setAuth({ status: "login", user: null, configurationError: false });
        }}
      />
    );
  }
  return (
    <Login
      configurationError={auth.configurationError}
      onSuccess={(result) => setAuth({ status: "authorized", user: result.user, configurationError: false })}
    />
  );
}

/* ── Login ─────────────────────────────────────────────────────────────────── */
function Login({ onSuccess, configurationError }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || configurationError) return;
    setSubmitting(true);
    setError("");
    try {
      onSuccess(await signInAdmin(email, pass));
    } catch (authError) {
      setError(authError?.message || "Sign-in failed. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-noir px-5">
      <form onSubmit={submit}
        className="admin-enter w-full max-w-[400px] rounded-3xl border border-champ/25 bg-[#1d1913] p-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] sm:p-9">
        <div className="mb-8 flex flex-col items-center gap-3 text-cream">
          <Logo size={40} />
          <Wordmark />
          <p className="mt-1 flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-champ-lt">
            <Lock size={11} /> Admin access
          </p>
        </div>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" autoFocus />
        <Field label="Password" type="password" value={pass} onChange={setPass} autoComplete="current-password" />
        <div className="min-h-[3.25rem]" aria-live="polite">
          {(error || configurationError) && (
            <p className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-center text-[0.78rem] text-red-300">
              {configurationError
                ? "Admin access is not configured for this deployment."
                : error}
            </p>
          )}
        </div>
        <button type="submit" disabled={submitting || configurationError}
          className="w-full rounded-xl bg-champ px-6 py-3.5 text-[0.82rem] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-champ-lt disabled:cursor-not-allowed disabled:opacity-55">
          {submitting ? "Verifying…" : "Sign in securely"}
        </button>
        <p className="mt-5 text-center text-[0.66rem] leading-relaxed text-cream/35">
          Protected by Supabase Auth and database-level admin policies.
        </p>
      </form>
    </div>
  );
}

function Field({ label, type, value, onChange, autoFocus, autoComplete }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cream/45">{label}</span>
      <input type={type} value={value} autoFocus={autoFocus} autoComplete={autoComplete} required
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream/15 bg-noir px-4 py-3 text-[0.9rem] text-cream outline-none transition-colors focus:border-champ" />
    </label>
  );
}

/* ── Dashboard shell: sidebar + header + sections ─────────────────────────── */
const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reservations", label: "Reservations", icon: CalendarRange },
];

function Shell({ onLogout, user }) {
  const [section, setSection] = useState("overview");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [analytics, setAnalytics] = useState(null);

  // Async fetch from Supabase (skeletons show while loading).
  const refresh = useCallback(async () => {
    try {
      setFetchError(null);
      const [result, dashboardAnalytics] = await Promise.all([
        getReservationsPage({ page, pageSize: PAGE_SIZE }),
        getReservationAnalytics(),
      ]);
      setItems(result.items);
      setTotal(result.total);
      setAnalytics(dashboardAnalytics);
    } catch (err) {
      console.error("[AFSAHI] Failed to load reservations:", err);
      setFetchError(
        err?.message?.includes("Could not find the table")
          ? "The reservations schema is missing — run the checked-in Supabase migration."
          : "Couldn't load reservations from Supabase. Check your connection and try again."
      );
    }
  }, [page]);

  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
  }, [refresh]);

  const setStatus = async (id, status) => {
    try { await updateReservationStatus(id, status); await refresh(); }
    catch (err) { console.error(err); window.alert("Update failed — check your connection."); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this reservation permanently?")) return;
    try { await deleteReservation(id); await refresh(); }
    catch (err) { console.error(err); window.alert("Delete failed — check your connection."); }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-champ/15 bg-noir px-4 py-6 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2 text-cream">
          <Logo size={32} />
          <div className="leading-tight">
            <p className="text-[0.8rem] font-bold tracking-[0.14em]">AFSAHI</p>
            <p className="text-[0.55rem] uppercase tracking-[0.22em] text-champ-lt">Admin Suite</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setSection(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[0.8rem] font-medium transition-all duration-300 ${
                section === n.id
                  ? "bg-champ text-white shadow-[0_10px_24px_-10px_rgba(169,130,63,0.7)]"
                  : "text-cream/55 hover:bg-cream/5 hover:text-cream"
              }`}>
              <n.icon size={16} strokeWidth={1.9} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-champ/25 bg-champ/10 p-3">
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-champ-lt">
              <Crown size={11} /> Supabase live
            </p>
            <p className="mt-1 text-[0.62rem] leading-relaxed text-cream/45">
              Reservations sync from all client devices via Supabase.
            </p>
          </div>
          <button onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[0.8rem] font-medium text-cream/55 transition-colors hover:bg-cream/5 hover:text-cream">
            <LogOut size={16} strokeWidth={1.9} /> Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-3">
              <span className="lg:hidden"><Logo size={26} /></span>
              <h1 className="text-[1.02rem] font-semibold text-ink">
                {NAV.find((n) => n.id === section)?.label}
              </h1>
            </div>
            {/* Mobile nav */}
            <nav className="flex gap-1 lg:hidden">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => setSection(n.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors ${
                    section === n.id ? "bg-champ text-white" : "text-muted hover:text-ink"
                  }`}>
                  {n.label}
                </button>
              ))}
            </nav>
            {/* Admin profile */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right leading-tight">
                <p className="max-w-[14rem] truncate text-[0.78rem] font-semibold text-ink">{user?.email || "Administrator"}</p>
                <p className="text-[0.6rem] uppercase tracking-[0.14em] text-champ-dk">Owner</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-champ/40 bg-champ/15 text-champ-dk">
                <UserRound size={16} strokeWidth={1.8} />
              </span>
              <button onClick={onLogout} title="Log out"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-champ hover:text-champ-dk lg:hidden">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-7">
          {fetchError && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
              <p className="text-[0.8rem] text-red-700">{fetchError}</p>
              <button onClick={() => { setLoading(true); refresh().finally(() => setLoading(false)); }}
                className="rounded-full border border-red-500/40 px-4 py-1.5 text-[0.72rem] font-semibold text-red-700 transition-colors hover:bg-red-500/15">
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <Skeletons />
          ) : section === "overview" ? (
            <Suspense fallback={<Skeletons />}><Overview analytics={analytics} /></Suspense>
          ) : (
            <Suspense fallback={<Skeletons />}>
              <ReservationsTable
                items={items}
                onStatus={setStatus}
                onDelete={remove}
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPage={setPage}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminLoading({ label }) {
  return (
    <div className="grid min-h-screen place-items-center bg-noir px-5 text-center text-cream/65">
      <div>
        <span className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-champ/25 border-t-champ" />
        <p className="text-[0.76rem] uppercase tracking-[0.16em]">{label}</p>
      </div>
    </div>
  );
}

/* Loading skeletons — shimmer blocks matching the layout */
function Skeletons() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[86px] rounded-2xl bg-sand" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-[300px] rounded-2xl bg-sand lg:col-span-2" />
        <div className="h-[300px] rounded-2xl bg-sand" />
      </div>
      <div className="h-[260px] rounded-2xl bg-sand" />
    </div>
  );
}
