import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { AdminLayout } from "./layout";
import {
  MapPin, Clock, CheckCircle, Truck, AlertCircle, Package,
  TrendingUp, Leaf, Search, Zap, Eye, RefreshCcw, X, BarChart2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  RadialBarChart, RadialBar, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  AreaChart, Area,
} from "recharts";
const API_URL = import.meta.env.VITE_API_URL;
const TOOLTIP_STYLE = {
  background: "rgba(5,10,20,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "8px 12px",
  color: "#fff",
  fontSize: 12,
};

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  holding:   { label: "In Holding",   color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   icon: Clock },
  matched:   { label: "Matched",      color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   icon: CheckCircle },
  shipped:   { label: "Shipped",      color: "#22C55E", bg: "rgba(34,197,94,0.1)",    icon: Truck },
  expired:   { label: "Expired",      color: "#EF4444", bg: "rgba(239,68,68,0.1)",    icon: AlertCircle },
  warehouse: { label: "To Warehouse", color: "#6B7280", bg: "rgba(107,114,128,0.1)",  icon: Package },
};

const gradeColors: Record<string, string> = {
  excellent: "#22C55E", good: "#3B82F6", fair: "#F59E0B", poor: "#EF4444",
};

const hubTypeColors: Record<string, string> = {
  delivery_station: "#3B82F6",
  fulfillment_hub:  "#8B5CF6",
  partner_store:    "#F59E0B",
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    const dur = 900;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== undefined) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      {label && <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color || "#fff" }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

function HoldingDetail({
  h, onClose, onStatusChange,
}: {
  h: any; onClose: () => void; onStatusChange: (id: number, status: string) => void;
}) {
  const sc = statusConfig[h.status] || statusConfig.holding;
  const StatusIcon = sc.icon;
  const daysHeld = Math.floor((Date.now() / 1000 - h.held_since) / 86400);
  const daysLeft = Math.ceil((h.expires_at - Date.now() / 1000) / 86400);
  const savingsPercent = h.original_price > 0
    ? Math.round(((h.original_price - h.holding_price) / h.original_price) * 100)
    : 0;

  const demandMetrics = [
    { label: "Local Search Trend", value: h.local_search_trend ?? 0, color: "#3B82F6" },
    { label: "Cart Additions", value: h.cart_additions ?? 0, color: "#F59E0B" },
    { label: "Wishlist Count", value: h.wishlist_count ?? 0, color: "#EC4899" },
    { label: "Historical Sales", value: h.historical_sales_score ?? 0, color: "#22C55E" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          {h.image_url ? (
            <img src={h.image_url} alt={h.product_name}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-bg-elevated)" }}>
              <Package size={24} style={{ color: "var(--color-text-muted)" }} />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                style={{ background: (gradeColors[h.quality_grade] ?? "#6B7280") + "20", color: gradeColors[h.quality_grade] ?? "#6B7280" }}>
                {h.quality_grade}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ background: sc.bg, color: sc.color }}>
                <StatusIcon size={10} /> {sc.label}
              </span>
            </div>
            <h2 className="text-lg font-bold mb-0.5" style={{ color: "var(--color-text-primary)" }}>{h.product_name}</h2>
            <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>{h.brand} · {h.category}</div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Original Price</div>
              <div className="font-bold" style={{ color: "var(--color-text-secondary)" }}>₹{h.original_price?.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="text-xs mb-1" style={{ color: "#22C55E" }}>Holding Price</div>
              <div className="font-bold text-lg" style={{ color: "#22C55E" }}>₹{h.holding_price?.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)" }}>
              <div className="text-xs mb-1" style={{ color: "#EF4444" }}>Discount</div>
              <div className="font-bold" style={{ color: "#EF4444" }}>-{savingsPercent}%</div>
            </div>
          </div>

          {/* Hub info */}
          <div className="p-4 rounded-xl border" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-elevated)" }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} style={{ color: hubTypeColors[h.hub_type] ?? "#3B82F6" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{h.hub_name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: (hubTypeColors[h.hub_type] ?? "#3B82F6") + "20", color: hubTypeColors[h.hub_type] ?? "#3B82F6" }}>
                {h.hub_type?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
              {h.hub_address || `${h.hub_city}, ${h.hub_state}`}
            </div>
            {/* Capacity bar */}
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
              <span>Hub Capacity</span>
              <span>{h.hub_current_load}/{h.hub_capacity}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
              <div className="h-1.5 rounded-full"
                style={{
                  width: h.hub_capacity ? `${Math.min((h.hub_current_load / h.hub_capacity) * 100, 100)}%` : "0%",
                  background: (h.hub_current_load / h.hub_capacity) > 0.8 ? "#EF4444" : (h.hub_current_load / h.hub_capacity) > 0.6 ? "#F59E0B" : "#22C55E",
                }} />
            </div>
            <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span>{daysHeld}d held</span>
              <span style={{ color: daysLeft <= 2 ? "#EF4444" : daysLeft <= 4 ? "#F59E0B" : "var(--color-text-muted)" }}>
                {daysLeft > 0 ? `${daysLeft}d remaining` : "Expired"}
              </span>
            </div>
          </div>

          {/* AI Demand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} style={{ color: "#8B5CF6" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>AI Demand Forecast</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#8B5CF620", color: "#8B5CF6" }}>
                Score: {h.demand_score}/100
              </span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={demandMetrics} layout="vertical" barSize={10}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={120} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" name="Score" radius={[0, 4, 4, 0]}>
                  {demandMetrics.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="p-3 rounded-xl border-l-2 mt-3"
              style={{ background: "rgba(139,92,246,0.06)", borderColor: "#8B5CF6" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: "#8B5CF6" }}>Resale Probability</span>
                <span className="text-lg font-black"
                  style={{ color: h.resale_probability > 70 ? "#22C55E" : h.resale_probability > 45 ? "#F59E0B" : "#EF4444" }}>
                  {h.resale_probability}%
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {h.forecast_reasoning}
              </p>
            </div>
          </div>

          {/* Order details */}
          {(h.matched_order_id || h.shipped_at) && (
            <div className="p-4 rounded-xl border"
              style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} style={{ color: "#22C55E" }} />
                <span className="font-semibold text-sm" style={{ color: "#22C55E" }}>Order Details</span>
              </div>
              {h.matched_order_id && (
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Order ID: <span className="font-mono font-semibold">{h.matched_order_id}</span>
                </div>
              )}
              {h.matched_at && (
                <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Matched: {new Date(h.matched_at * 1000).toLocaleString("en-IN")}
                </div>
              )}
              {h.shipped_at && (
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  Shipped: {new Date(h.shipped_at * 1000).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          )}

          {/* Environmental impact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Leaf size={16} style={{ color: "#22C55E" }} />
              <div>
                <div className="font-bold" style={{ color: "#22C55E" }}>{h.co2_saved} kg CO₂</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Emissions saved</div>
              </div>
            </div>
            <div className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Truck size={16} style={{ color: "#3B82F6" }} />
              <div>
                <div className="font-bold" style={{ color: "#3B82F6" }}>{h.distance_saved_km} km</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Distance saved</div>
              </div>
            </div>
          </div>

          {/* Status actions */}
          {["holding", "matched"].includes(h.status) && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>UPDATE STATUS</div>
              <div className="flex gap-2 flex-wrap">
                {h.status === "holding" && (
                  <button onClick={() => { onStatusChange(h.id, "matched"); onClose(); }}
                    className="px-4 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "#8B5CF620", color: "#8B5CF6", border: "1px solid #8B5CF640" }}>
                    Mark Matched
                  </button>
                )}
                {(h.status === "holding" || h.status === "matched") && (
                  <button onClick={() => { onStatusChange(h.id, "shipped"); onClose(); }}
                    className="px-4 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40" }}>
                    Mark Shipped
                  </button>
                )}
                {h.status === "holding" && (
                  <button onClick={() => { onStatusChange(h.id, "warehouse"); onClose(); }}
                    className="px-4 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "#6B728020", color: "#6B7280", border: "1px solid #6B728040" }}>
                    Send to Warehouse
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLRHN() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "lrhn"],
    queryFn: async () => {
      const res = await (api as any).admin.lrhn.$get();
      return res.json();
    },
  });

  const { data: hubsData } = useQuery({
    queryKey: ["admin", "hubs"],
    queryFn: async () => {
      const res = await (api as any).admin.hubs.$get();
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`${API_URL}/api/admin/lrhn/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "lrhn"] }),
  });

  const holdings: any[] = data?.holdings ?? [];
  const hubs: any[] = hubsData?.hubs ?? [];

  const filtered = holdings.filter((h) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || h.product_name.toLowerCase().includes(q)
      || h.brand?.toLowerCase().includes(q)
      || h.hub_city?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = holdings.reduce((acc, h) => {
    acc[h.status] = (acc[h.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCO2 = holdings.reduce((s, h) => s + (h.co2_saved || 0), 0);
  const totalDist = holdings.reduce((s, h) => s + (h.distance_saved_km || 0), 0);
  const avgDemand = holdings.length
    ? Math.round(holdings.reduce((s, h) => s + (h.demand_score || 0), 0) / holdings.length)
    : 0;

  // Hub capacity chart data
  const hubChartData = hubs.map((hub: any) => ({
    name: hub.city?.slice(0, 8) ?? "Hub",
    load: hub.current_load ?? 0,
    capacity: hub.capacity ?? 0,
    free: Math.max((hub.capacity ?? 0) - (hub.current_load ?? 0), 0),
  }));

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={20} style={{ color: "var(--color-accent-green)" }} />
            <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>
              Local Return Holding Network
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Returned products held at nearby hubs for local resale — eliminating warehouse routing
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Holdings", value: statusCounts["holding"] || 0, icon: Clock, color: "#3B82F6" },
            { label: "CO₂ Saved (kg)", value: Math.round(totalCO2), icon: Leaf, color: "#22C55E" },
            { label: "Avg Demand Score", value: avgDemand, icon: TrendingUp, color: "#8B5CF6", suffix: "/100" },
            { label: "Distance Saved (km)", value: Math.round(totalDist), icon: Truck, color: "#06B6D4" },
          ].map(({ label, value, icon: Icon, color, suffix }) => (
            <div key={label} className="p-5 rounded-2xl border flex items-start gap-4"
              style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-black leading-none mb-1" style={{ color }}>
                  <AnimatedNumber value={value} suffix={suffix} />
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {hubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Hub capacity stacked bar */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Hub Capacity Utilisation</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={hubChartData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="load" name="In Use" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="free" name="Free" stackId="a" fill="rgba(59,130,246,0.15)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status distribution */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Holding Status Distribution</div>
              <div className="space-y-3">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = statusCounts[key] || 0;
                  const pct = holdings.length ? Math.round((count / holdings.length) * 100) : 0;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon size={12} style={{ color: cfg.color }} />
                          <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{cfg.label}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{count} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { step: "1", title: "Return Received", desc: "Customer initiates return", icon: RefreshCcw, color: "#3B82F6" },
            { step: "2", title: "AI Grades Quality", desc: "Automated in minutes", icon: Zap, color: "#8B5CF6" },
            { step: "3", title: "Local Hub Routing", desc: "Nearest station, 7-day window", icon: MapPin, color: "#F59E0B" },
            { step: "4", title: "Local Resale", desc: "Match → direct ship or warehouse", icon: Truck, color: "#22C55E" },
          ].map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="p-4 rounded-2xl border relative overflow-hidden"
              style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="absolute top-2 right-3 text-4xl font-black opacity-[0.04]" style={{ color }}>{step}</div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "20" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div className="text-xs font-bold mb-0.5" style={{ color }}>{title}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, city…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "holding", "matched", "shipped", "expired", "warehouse"].map((s) => {
              const sc = statusConfig[s];
              const count = s === "all" ? holdings.length : statusCounts[s] || 0;
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  style={{
                    background: active ? (sc?.color ?? "#22C55E") + "20" : "var(--color-bg-elevated)",
                    color: active ? (sc?.color ?? "#22C55E") : "var(--color-text-muted)",
                    border: `1px solid ${active ? (sc?.color ?? "#22C55E") + "50" : "var(--color-border)"}`,
                  }}>
                  {s === "all" ? "All" : sc?.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Holdings table */}
        <div className="rounded-2xl overflow-hidden border overflow-x-auto mb-8" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)" }}>
                {["Product", "Hub & Location", "Status", "AI Demand", "Resale Prob.", "Holding Period", "Impact", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 rounded animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />
                      </td>
                    ))}
                  </tr>
                ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No holdings found
                      </td>
                    </tr>
                  )
                  : filtered.map((h) => {
                    const sc = statusConfig[h.status] || statusConfig.holding;
                    const StatusIcon = sc.icon;
                    const daysHeld = Math.floor((Date.now() / 1000 - h.held_since) / 86400);
                    const daysLeft = Math.ceil((h.expires_at - Date.now() / 1000) / 86400);
                    const gc = gradeColors[h.quality_grade] ?? "#3B82F6";
                    return (
                      <tr key={h.id}
                        className="border-t cursor-pointer transition-colors"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}
                        onClick={() => setSelected(h)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg-card)")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {h.image_url ? (
                              <img src={h.image_url} alt={h.product_name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: "var(--color-bg-elevated)" }}>
                                <Package size={14} style={{ color: "var(--color-text-muted)" }} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                                {h.product_name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{h.brand}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                                  style={{ background: gc + "15", color: gc }}>{h.quality_grade}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{h.hub_city}</div>
                          <div className="text-xs" style={{ color: hubTypeColors[h.hub_type] ?? "#3B82F6" }}>
                            {h.hub_type?.replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ background: sc.bg, color: sc.color }}>
                            <StatusIcon size={10} /> {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                              <div className="h-1.5 rounded-full"
                                style={{ width: `${h.demand_score}%`, background: h.demand_score > 70 ? "#22C55E" : h.demand_score > 45 ? "#F59E0B" : "#EF4444" }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{h.demand_score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-sm"
                            style={{ color: h.resale_probability > 70 ? "#22C55E" : h.resale_probability > 45 ? "#F59E0B" : "#EF4444" }}>
                            {h.resale_probability}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{daysHeld}d held</div>
                          <div className="text-xs"
                            style={{ color: daysLeft <= 2 ? "#EF4444" : daysLeft <= 4 ? "#F59E0B" : "var(--color-text-muted)" }}>
                            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold" style={{ color: "#22C55E" }}>{h.co2_saved}kg CO₂</div>
                          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{h.distance_saved_km}km saved</div>
                        </td>
                        <td className="px-4 py-3">
                          <Eye size={14} style={{ color: "var(--color-text-muted)" }} />
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Hub network */}
        <div>
          <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-text-primary)" }}>Hub Network</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {hubs.map((hub: any) => {
              const loadPct = hub.capacity ? Math.round((hub.current_load / hub.capacity) * 100) : 0;
              const typeColor = hubTypeColors[hub.type] ?? "#3B82F6";
              return (
                <div key={hub.id} className="p-4 rounded-2xl border transition-colors"
                  style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = typeColor + "40")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: typeColor + "15", color: typeColor }}>
                      {hub.type?.replace(/_/g, " ")}
                    </span>
                    <div className={`w-2 h-2 rounded-full mt-1 ${hub.is_active ? "bg-green-500" : "bg-gray-500"}`} />
                  </div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: "var(--color-text-primary)" }}>{hub.city}</div>
                  <div className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>{hub.name}</div>
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                    <span>Load</span>
                    <span style={{ color: loadPct > 80 ? "#EF4444" : loadPct > 60 ? "#F59E0B" : "#22C55E", fontWeight: 600 }}>
                      {hub.current_load}/{hub.capacity} ({loadPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${loadPct}%`, background: loadPct > 80 ? "#EF4444" : loadPct > 60 ? "#F59E0B" : "#22C55E" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <HoldingDetail
          h={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        />
      )}
    </AdminLayout>
  );
}
