/* Admin · Overview — KPI cards, revenue/status/vehicle charts, top routes.
   Revenue counts CONFIRMED reservations only (see lib/analytics.js). */
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  Wallet, CalendarDays, Sun, Inbox, Sparkles, CheckCircle2, XCircle, Gauge,
} from "lucide-react";
import {
  fmtMAD,
} from "../../lib/analytics.js";

const GOLD = "#A9823F";

export default function Overview({ analytics }) {
  const k = analytics?.kpis || {};
  const revData = analytics?.revenueByMonth || [];
  const statusData = analytics?.reservationsByStatus || [];
  const vehicleData = analytics?.bookingsByVehicle || [];
  const routes = analytics?.topRoutes || [];

  const kpis = [
    { label: "Total revenue", value: fmtMAD(k.totalRevenue), icon: Wallet, gold: true,
      sub: k.pendingValue ? `+ ${fmtMAD(k.pendingValue)} pending (New)` : "Confirmed only" },
    { label: "Monthly revenue", value: fmtMAD(k.monthlyRevenue), icon: CalendarDays },
    { label: "Today revenue", value: fmtMAD(k.todayRevenue), icon: Sun },
    { label: "Avg booking value", value: fmtMAD(k.avgBookingValue), icon: Gauge },
    { label: "Total reservations", value: k.totalReservations, icon: Inbox },
    { label: "New", value: k.newCount, icon: Sparkles, gold: true },
    { label: "Confirmed", value: k.confirmedCount, icon: CheckCircle2 },
    { label: "Cancelled", value: k.cancelledCount, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label}
            className={`group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(21,18,12,0.35)] ${
              c.gold ? "border-champ/40 bg-gradient-to-br from-champ/15 to-surface" : "border-line bg-surface"
            }`}>
            <div className="flex items-center justify-between">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted">{c.label}</p>
              <c.icon size={15} className="text-champ transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
            </div>
            <p className="mt-2 truncate text-[1.28rem] font-bold leading-none text-ink">{c.value}</p>
            {c.sub && <p className="mt-1.5 truncate text-[0.62rem] text-champ-dk">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Revenue by month" subtitle="Confirmed reservations · MAD" className="lg:col-span-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DECC" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8B8275" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8B8275" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [fmtMAD(v), "Revenue"]} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5}
                  dot={{ r: 3.5, fill: GOLD, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Reservations by status">
          <div className="h-[240px]">
            {statusData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name"
                    innerRadius="58%" outerRadius="82%" paddingAngle={3} strokeWidth={0}>
                    {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-4">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-[0.7rem] text-body">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.name} · {s.value}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Vehicle bookings" className="lg:col-span-2">
          <div className="h-[230px]">
            {vehicleData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7DECC" vertical={false} />
                  <XAxis dataKey="vehicle" tick={{ fontSize: 10, fill: "#8B8275" }} axisLine={false} tickLine={false}
                    interval={0} tickFormatter={(v) => (v.length > 12 ? v.slice(0, 11) + "…" : v)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8B8275" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, "Bookings"]} contentStyle={tooltipStyle} cursor={{ fill: "rgba(169,130,63,0.07)" }} />
                  <Bar dataKey="count" fill={GOLD} radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Top routes">
          {routes.length === 0 ? (
            <p className="py-10 text-center text-[0.78rem] text-muted">No routes yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="pb-2">Route</th>
                  <th className="pb-2 text-right">Trips</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {routes.map((r) => (
                  <tr key={r.route} className="text-[0.78rem] text-body">
                    <td className="max-w-[9.5rem] truncate py-2.5 font-medium text-ink">{r.route}</td>
                    <td className="py-2.5 text-right">{r.count}</td>
                    <td className="py-2.5 text-right text-champ-dk">{fmtMAD(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#16130D", border: "1px solid rgba(169,130,63,0.4)", borderRadius: 12,
  color: "#F6F2EA", fontSize: 12, padding: "8px 12px",
};

function Card({ title, subtitle, className = "", children }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[0.9rem] font-semibold text-ink">{title}</h3>
        {subtitle && <span className="text-[0.64rem] text-muted">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="grid h-full place-items-center text-[0.78rem] text-muted">No data yet.</div>;
}
