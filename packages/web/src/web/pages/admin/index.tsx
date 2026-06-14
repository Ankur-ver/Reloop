import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { AdminLayout } from "./layout";
import {
  Package, RefreshCcw, Users, MapPin, TrendingUp, Leaf,
  CheckCircle, Clock, Truck, AlertCircle, BarChart2, Zap,
  Globe, Coins, ShoppingBag, ArrowUpRight, Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const end = isNaN(num) ? 0 : num;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(end * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [num]);
  const formatted = Number.isInteger(num) ? Math.round(display).toLocaleString() : display.toFixed(1);
  return <>{formatted}{suffix}</>;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs shadow-xl"
      style={{ background: "rgba(5,10,20,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
      {label && <div className="font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, suffix }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden p-5 rounded-2xl cursor-default transition-all duration-300"
      style={{
        background: hov ? `linear-gradient(135deg, ${color}12, ${color}05)` : "var(--color-bg-card)",
        border: `1px solid ${hov ? color + "40" : "var(--color-border)"}`,
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 8px 24px ${color}20` : "none",
      }}>
      <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full blur-2xl transition-opacity duration-300"
        style={{ background: color, opacity: hov ? 0.25 : 0.08 }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{ background: hov ? `${color}25` : `${color}12` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowUpRight size={13} style={{ color: hov ? color : "var(--color-text-muted)", transition: "color 0.2s" }} />
      </div>
      <div className="text-2xl font-black mb-0.5 tracking-tight" style={{ color: "var(--color-text-primary)", fontFamily: "JetBrains Mono" }}>
        <AnimatedCounter value={typeof value === "number" ? value : parseFloat(value) || 0} suffix={suffix} />
      </div>
      <div className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</div>}
    </div>
  );
}

// ─── LRHN Status Ring ────────────────────────────────────────────────────────
const LRHN_COLORS: Record<string, string> = {
  holding: "#3B82F6", matched: "#8B5CF6", shipped: "#22C55E", expired: "#EF4444", warehouse: "#6B7280",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  holding:   { label: "In Holding",     color: "#3B82F6", icon: Clock },
  matched:   { label: "Matched",        color: "#8B5CF6", icon: CheckCircle },
  shipped:   { label: "Shipped",        color: "#22C55E", icon: Truck },
  expired:   { label: "Expired",        color: "#EF4444", icon: AlertCircle },
  warehouse: { label: "To Warehouse",   color: "#6B7280", icon: Package },
};

const DISP_COLORS: Record<string, string> = {
  resell: "#22C55E", refurbish: "#3B82F6", donate: "#F59E0B", recycle: "#6B7280", exchange: "#8B5CF6",
};
const CHART_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#06B6D4", "#EF4444", "#84CC16", "#EC4899"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [trendKey, setTrendKey] = useState<"returns" | "co2">("returns");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await (api as any).admin.stats.$get();
      return res.json();
    },
  });

  const { data: holdingsData } = useQuery({
    queryKey: ["admin", "lrhn"],
    queryFn: async () => {
      const res = await (api as any).admin.lrhn.$get();
      return res.json();
    },
  });

  const recentHoldings = holdingsData?.holdings?.slice(0, 6) || [];
  const stats = data?.overview;
  const lrhn = data?.lrhn;
  const monthlyTrend = data?.monthlyTrend || [];
  const dispositionBreakdown = data?.dispositionBreakdown || {};
  const categoryBreakdown = data?.categoryBreakdown || [];

  const lrhnPieData = lrhn
    ? Object.entries({ holding: lrhn.holding, matched: lrhn.matched, shipped: lrhn.shipped, expired: lrhn.expired, warehouse: lrhn.warehouse })
        .filter(([, v]) => parseInt(v as any) > 0)
        .map(([k, v]) => ({ name: statusConfig[k]?.label || k, value: parseInt(v as any), color: LRHN_COLORS[k] }))
    : [];

  const dispPieData = Object.entries(dispositionBreakdown)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: k, value: v as number, color: DISP_COLORS[k] || "#888" }));

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-screen-xl">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} style={{ color: "var(--color-accent-green)" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-accent-green)" }}>Overview</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--color-text-primary)" }}>Admin Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              ReLoop platform — returns, products, LRHN, and sustainability metrics
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />)}
            </div>
          </div>
        ) : (
          <>
            {/* ── Platform Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              <StatCard label="Total Returns"   value={stats?.totalReturns ?? 0}   icon={RefreshCcw}   color="#8B5CF6" />
              <StatCard label="Products"        value={stats?.totalProducts ?? 0}  icon={Package}      color="#F59E0B" />
              <StatCard label="P2P Listings"    value={stats?.totalP2P ?? 0}       icon={ShoppingBag}  color="#06B6D4" />
              <StatCard label="Users"           value={stats?.totalUsers ?? 0}     icon={Users}        color="#22C55E" />
              <StatCard label="CO₂ Saved"       value={stats?.totalCo2 ?? 0}       icon={Globe}        color="#3B82F6" suffix="kg" />
              <StatCard label="Credits Issued"  value={stats?.totalCredits ?? 0}   icon={Coins}        color="#F59E0B" />
            </div>

            {/* ── Trend + Disposition ── */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">

              {/* Area trend */}
              <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
                      <TrendingUp size={14} style={{ color: "var(--color-accent-green)" }} />
                    </div>
                    <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Platform Activity</span>
                  </div>
                  <div className="flex gap-1.5">
                    {(["returns", "co2"] as const).map(tab => (
                      <button key={tab} onClick={() => setTrendKey(tab)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: trendKey === tab ? (tab === "returns" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)") : "var(--color-bg-elevated)",
                          color: trendKey === tab ? (tab === "returns" ? "#8B5CF6" : "#3B82F6") : "var(--color-text-muted)",
                          border: trendKey === tab ? `1px solid ${tab === "returns" ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)"}` : "1px solid transparent",
                        }}>
                        {tab === "returns" ? "Returns" : "CO₂ Saved"}
                      </button>
                    ))}
                  </div>
                </div>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={trendKey === "returns" ? "#8B5CF6" : "#3B82F6"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={trendKey === "returns" ? "#8B5CF6" : "#3B82F6"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey={trendKey} name={trendKey === "returns" ? "Returns" : "CO₂ (kg)"}
                        stroke={trendKey === "returns" ? "#8B5CF6" : "#3B82F6"} strokeWidth={2.5}
                        fill="url(#adminGrad)"
                        dot={{ fill: trendKey === "returns" ? "#8B5CF6" : "#3B82F6", r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>No data yet</div>
                )}
              </div>

              {/* Disposition Pie */}
              <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
                    <BarChart2 size={14} style={{ color: "var(--color-accent-green)" }} />
                  </div>
                  <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Disposition Mix</span>
                </div>
                {dispPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={dispPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                          dataKey="value" paddingAngle={3} strokeWidth={0}>
                          {dispPieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-2">
                      {dispPieData.map((item: any) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="capitalize" style={{ color: "var(--color-text-secondary)" }}>{item.name}</span>
                          </div>
                          <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm opacity-40" style={{ color: "var(--color-text-muted)" }}>No dispositions yet</div>
                )}
              </div>
            </div>

            {/* ── Category bar + LRHN ring ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Category bar */}
              <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
                    <Package size={14} style={{ color: "#F59E0B" }} />
                  </div>
                  <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>Returns by Category</span>
                </div>
                {categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={categoryBreakdown} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barCategoryGap="38%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Returns" radius={[6, 6, 0, 0]}>
                        {categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm opacity-40" style={{ color: "var(--color-text-muted)" }}>No data yet</div>
                )}
              </div>

              {/* LRHN status ring */}
              <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                    <MapPin size={14} style={{ color: "#3B82F6" }} />
                  </div>
                  <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>LRHN Status</span>
                </div>
                {lrhnPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={lrhnPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58}
                          dataKey="value" paddingAngle={3} strokeWidth={0}>
                          {lrhnPieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {lrhnPieData.map((item: any) => (
                        <div key={item.name} className="flex items-center gap-2 text-xs p-2 rounded-lg"
                          style={{ background: `${item.color}08` }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span style={{ color: "var(--color-text-secondary)" }}>{item.name}</span>
                          <span className="ml-auto font-bold" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm opacity-40" style={{ color: "var(--color-text-muted)" }}>No holdings yet</div>
                )}
              </div>
            </div>

            {/* ── LRHN Impact Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "CO₂ Saved via LRHN", value: `${lrhn?.totalCo2Saved ?? 0}kg`, sub: "vs central warehouse routing", color: "#22C55E", icon: Leaf },
                { label: "Distance Eliminated", value: `${(parseInt(lrhn?.totalDistanceSaved) || 0).toLocaleString()}km`, sub: "total logistics saved", color: "#3B82F6", icon: Truck },
                { label: "Local Resale Rate", value: `${lrhn?.localResaleRate ?? 0}%`, sub: "matched before expiry", color: "#8B5CF6", icon: Zap },
              ].map(({ label, value, sub, color, icon: Icon }) => (
                <div key={label} className="p-5 rounded-2xl" style={{ background: `linear-gradient(135deg, ${color}10, ${color}04)`, border: `1px solid ${color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={15} style={{ color }} />
                    <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                  </div>
                  <div className="text-3xl font-black" style={{ color, fontFamily: "JetBrains Mono" }}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* ── Recent LRHN Table ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ background: "var(--color-bg-card)", borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#3B82F6" }} />
                  <span className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>Recent LRHN Activity</span>
                </div>
                <a href="/admin/lrhn" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "var(--color-accent-green)" }}>View all →</a>
              </div>
              <div style={{ background: "var(--color-bg-card)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["Product", "Hub", "Status", "Demand", "Resale %", "Age"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentHoldings.map((h: any, idx: number) => {
                      const sc = statusConfig[h.status] || statusConfig.holding;
                      const StatusIcon = sc.icon;
                      const heldDays = Math.floor((Date.now() / 1000 - h.held_since) / 86400);
                      return (
                        <tr key={h.id}
                          className="transition-all duration-150"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{h.product_name}</div>
                            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{h.brand} · {h.category}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{h.hub_city}</div>
                            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{h.hub_type?.replace("_", " ")}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: sc.color + "15", color: sc.color }}>
                              <StatusIcon size={10} /> {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full w-16" style={{ background: "var(--color-border)" }}>
                                <div className="h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${h.demand_score}%`, background: h.demand_score > 70 ? "#22C55E" : h.demand_score > 45 ? "#F59E0B" : "#EF4444" }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{h.demand_score}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold"
                              style={{ color: h.resale_probability > 70 ? "#22C55E" : h.resale_probability > 45 ? "#F59E0B" : "#EF4444" }}>
                              {h.resale_probability}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {heldDays === 0 ? "Today" : `${heldDays}d ago`}
                          </td>
                        </tr>
                      );
                    })}
                    {recentHoldings.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-sm" style={{ color: "var(--color-text-muted)" }}>No holdings yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
