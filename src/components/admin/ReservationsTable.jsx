/* Admin · Reservations — filterable professional table with row actions.
   Data comes from the localStorage demo store (this browser only) — swap
   src/lib/reservations.js for Supabase/Firebase for real cross-device data. */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, XCircle, Trash2, MessageCircle, Download, Inbox, X, FilterX,
} from "lucide-react";
import { STATUS, downloadCSV } from "../../lib/reservations.js";
import { fmtMAD } from "../../lib/analytics.js";
import { buildWhatsAppUrl } from "../../lib/whatsapp.js";

const STATUS_STYLE = {
  [STATUS.NEW]:       "bg-champ/15 text-champ-dk border-champ/30",
  [STATUS.CONFIRMED]: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  [STATUS.CANCELLED]: "bg-red-500/10 text-red-600 border-red-500/25",
};

const shortPlace = (s) => (s || "—").split(",")[0].trim();

export default function ReservationsTable({ items, onStatus, onDelete }) {
  const [status, setStatus] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [msgOf, setMsgOf] = useState(null); // reservation whose message is open

  const vehicles = useMemo(() => [...new Set(items.map((r) => r.vehicle).filter(Boolean))], [items]);

  const filtered = useMemo(() => items.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (vehicle !== "all" && r.vehicle !== vehicle) return false;
    if (from && (r.date || "") < from) return false;
    if (to && (r.date || "") > to) return false;
    if (q) {
      const hay = `${r.pickup || ""} ${r.dropoff || ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [items, status, vehicle, from, to, q]);

  const hasFilters = status !== "all" || vehicle !== "all" || from || to || q;

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pickup / drop-off…"
            className="w-full rounded-xl border border-line bg-paper py-2.5 pl-9 pr-3 text-[0.82rem] text-ink outline-none transition-colors focus:border-champ" />
        </label>
        <Select label="Status" value={status} onChange={setStatus}
          options={[["all", "All"], [STATUS.NEW, "New"], [STATUS.CONFIRMED, "Confirmed"], [STATUS.CANCELLED, "Cancelled"]]} />
        <Select label="Vehicle" value={vehicle} onChange={setVehicle}
          options={[["all", "All"], ...vehicles.map((v) => [v, v])]} />
        <DateInput label="From" value={from} onChange={setFrom} />
        <DateInput label="To" value={to} onChange={setTo} />
        {hasFilters && (
          <button onClick={() => { setStatus("all"); setVehicle("all"); setFrom(""); setTo(""); setQ(""); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-[0.74rem] font-medium text-muted transition-colors hover:border-champ hover:text-champ-dk">
            <FilterX size={13} /> Clear
          </button>
        )}
        <button onClick={downloadCSV}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-champ px-4 py-2.5 text-[0.76rem] font-semibold text-white transition-colors hover:bg-champ-dk">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-line bg-surface py-20 text-center">
          <Inbox size={28} strokeWidth={1.4} className="text-champ" />
          <p className="mt-3 text-[0.95rem] font-semibold text-ink">
            {hasFilters ? "No reservations match these filters" : "No reservations yet"}
          </p>
          <p className="mt-1 max-w-sm text-[0.78rem] text-muted">
            {hasFilters
              ? "Try widening the date range or clearing filters."
              : 'When a client taps "Reserve via WhatsApp", the booking appears here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-line bg-sand/60 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <Th>Status</Th><Th>Route</Th><Th>Date · Time</Th><Th>Vehicle</Th>
                <Th className="text-right">Distance</Th><Th className="text-right">Duration</Th>
                <Th className="text-right">Price</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((r) => (
                <tr key={r.id} className="group text-[0.8rem] text-body transition-colors hover:bg-sand/40">
                  <Td>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] ${STATUS_STYLE[r.status] || ""}`}>
                      {r.status}
                    </span>
                    <p className="mt-1 text-[0.62rem] text-muted">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </Td>
                  <Td>
                    <p className="font-medium text-ink" title={`${r.pickup} → ${r.dropoff}`}>
                      {shortPlace(r.pickup)} → {shortPlace(r.dropoff)}
                    </p>
                  </Td>
                  <Td>{r.date || "—"}<span className="text-muted"> · {r.time || "—"}</span></Td>
                  <Td>{r.vehicle || "—"}</Td>
                  <Td className="text-right">{r.distanceKm != null ? `${r.distanceKm} km` : "—"}</Td>
                  <Td className="text-right">{r.durationText || "—"}</Td>
                  <Td className="text-right">
                    <span className="font-semibold text-ink">{r.priceMad != null ? fmtMAD(r.priceMad) : "—"}</span>
                    {r.priceEur != null && <p className="text-[0.64rem] text-champ-dk">≈ €{Number(r.priceEur).toFixed(2)}</p>}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <Action title="View WhatsApp message" onClick={() => setMsgOf(r)}
                        className="text-champ-dk hover:bg-champ/15"><MessageCircle size={15} /></Action>
                      <Action title="Confirm" onClick={() => onStatus(r.id, STATUS.CONFIRMED)}
                        className="text-emerald-600 hover:bg-emerald-500/10"><CheckCircle2 size={15} /></Action>
                      <Action title="Cancel" onClick={() => onStatus(r.id, STATUS.CANCELLED)}
                        className="text-red-500 hover:bg-red-500/10"><XCircle size={15} /></Action>
                      <Action title="Delete" onClick={() => onDelete(r.id)}
                        className="text-muted hover:bg-line/70"><Trash2 size={14} /></Action>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-right text-[0.68rem] text-muted">{filtered.length} of {items.length} reservations</p>

      {/* WhatsApp message modal */}
      <AnimatePresence>
        {msgOf && (
          <motion.div key="modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-noir/60 p-5 backdrop-blur-sm"
            onClick={() => setMsgOf(null)}>
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] rounded-2xl border border-champ/25 bg-surface p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.5)]">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-[0.95rem] font-semibold text-ink">Client WhatsApp message</h4>
                <button onClick={() => setMsgOf(null)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-line/60">
                  <X size={15} />
                </button>
              </div>
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl bg-sand p-4 text-[0.76rem] leading-relaxed text-body">
                {msgOf.message || "No message stored."}
              </pre>
              <a href={buildWhatsAppUrl(msgOf.message || "")} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[#1da851]">
                <MessageCircle size={15} /> Open in WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Th = ({ children, className = "" }) => <th className={`px-4 py-3 ${className}`}>{children}</th>;
const Td = ({ children, className = "" }) => <td className={`px-4 py-3.5 align-top ${className}`}>{children}</td>;

function Action({ title, onClick, className, children }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${className}`}>
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-line bg-paper px-3 py-2.5 text-[0.78rem] text-ink outline-none transition-colors focus:border-champ">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-line bg-paper px-3 py-2 text-[0.78rem] text-ink outline-none transition-colors focus:border-champ [color-scheme:light]" />
    </label>
  );
}
