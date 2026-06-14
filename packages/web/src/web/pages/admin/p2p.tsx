import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import {
  Users, CheckCircle, Clock, XCircle, Package, Star, MapPin,
  Search, TrendingUp, DollarSign, ShoppingBag, Eye,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { getToken } from "../../lib/auth";
const API_URL = import.meta.env.VITE_API_URL;
const TOOLTIP_STYLE = {
  background: "rgba(5,10,20,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "8px 12px",
  color: "#fff",
  fontSize: 12,
};

const gradeColor: Record<string, string> = {
  excellent: "#22C55E",
  good: "#84CC16",
  fair: "#EAB308",
  poor: "#EF4444",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active:  { label: "Active",   color: "#22C55E", icon: CheckCircle },
  sold:    { label: "Sold",     color: "#3B82F6", icon: Users },
  pending: { label: "Pending",  color: "#EAB308", icon: Clock },
  expired: { label: "Expired",  color: "#6B7280", icon: XCircle },
  removed: { label: "Removed",  color: "#EF4444", icon: XCircle },
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

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: "#6B7280", icon: Package };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

export default function AdminP2PPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"price" | "views" | "date">("price");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-p2p"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/p2p`, { headers: {
    Authorization: `Bearer ${getToken()}`
  } });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ listings: any[] }>;
    },
  });

  const listings = data?.listings ?? [];

  const filtered = listings
    .filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || l.title?.toLowerCase().includes(q)
        || l.seller_name?.toLowerCase().includes(q)
        || l.category?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "price") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "views") return (b.views ?? 0) - (a.views ?? 0);
      return 0;
    });

  const totalValue = listings.reduce((s, l) => s + (Number(l.price) || 0), 0);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const soldCount = listings.filter((l) => l.status === "sold").length;
  const totalViews = listings.reduce((s, l) => s + (l.views ?? 0), 0);

  const statusCounts = listings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPieData = Object.entries(statusCounts).map(([key, val]) => ({
    name: statusConfig[key]?.label ?? key,
    value: val as number,
    color: statusConfig[key]?.color ?? "#6B7280",
  }));

  // Category distribution
  const catCounts = listings.reduce((acc, l) => {
    if (l.category) acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const catData = Object.entries(catCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name: name.slice(0, 12), count }));

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} style={{ color: "var(--color-accent-green)" }} />
            <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>P2P Listings</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Peer-to-peer resale marketplace</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Listings", value: listings.length, icon: ShoppingBag, color: "#3B82F6" },
            { label: "Active Now", value: activeCount, icon: CheckCircle, color: "#22C55E" },
            { label: "Sold", value: soldCount, icon: TrendingUp, color: "#8B5CF6" },
            { label: "Total Views", value: totalViews, icon: Eye, color: "#06B6D4" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-5 rounded-2xl border flex items-start gap-4"
              style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-black leading-none mb-1" style={{ color }}>
                  <AnimatedNumber value={value} />
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Value highlight */}
        <div className="mb-6 p-5 rounded-2xl border flex items-center gap-6"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(6,182,212,0.04) 100%)", borderColor: "rgba(34,197,94,0.2)" }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "rgba(34,197,94,0.7)" }}>TOTAL MARKETPLACE VALUE</div>
            <div className="text-3xl font-black" style={{ color: "#22C55E" }}>
              ₹<AnimatedNumber value={totalValue} />
            </div>
          </div>
          <div className="h-12 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>AVG LISTING PRICE</div>
            <div className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              ₹{listings.length ? Math.round(totalValue / listings.length).toLocaleString("en-IN") : 0}
            </div>
          </div>
          <div className="h-12 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>CONVERSION RATE</div>
            <div className="text-xl font-bold" style={{ color: "#8B5CF6" }}>
              {listings.length ? Math.round((soldCount / listings.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Charts */}
        {listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Status pie */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Listing Status</div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={130}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3}>
                      {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {statusPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{d.name}</span>
                      <span className="text-xs font-bold ml-auto" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category bar */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Top Categories</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={catData} barSize={14} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" name="Listings" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, seller, category…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", ...Object.keys(statusConfig)].map((s) => {
              const cfg = statusConfig[s];
              const count = s === "all" ? listings.length : statusCounts[s] || 0;
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? (cfg?.color ?? "#22C55E") + "20" : "var(--color-bg-elevated)",
                    color: active ? (cfg?.color ?? "#22C55E") : "var(--color-text-muted)",
                    border: `1px solid ${active ? (cfg?.color ?? "#22C55E") + "50" : "var(--color-border)"}`,
                  }}>
                  {s === "all" ? "All" : cfg?.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5 ml-auto">
            <span className="text-xs self-center" style={{ color: "var(--color-text-muted)" }}>Sort:</span>
            {(["price", "views"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: sortBy === s ? "#22C55E20" : "var(--color-bg-elevated)",
                  color: sortBy === s ? "#22C55E" : "var(--color-text-muted)",
                  border: `1px solid ${sortBy === s ? "#22C55E50" : "var(--color-border)"}`,
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--color-accent-green)", borderTopColor: "transparent" }} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-sm" style={{ color: "#EF4444" }}>Failed to load listings</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ color: "var(--color-text-muted)" }}>No listings match your filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}>
                    {["Listing", "Category", "Grade", "Price", "Location", "Status", "Seller", "Views"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
                        style={{ color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l: any, i: number) => (
                    <tr key={l.id}
                      className="transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {l.image_url ? (
                            <img src={l.image_url} alt={l.title}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                              style={{ border: "1px solid var(--color-border)" }} />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: "var(--color-bg-elevated)" }}>
                              <Package size={14} style={{ color: "var(--color-text-muted)" }} />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-xs leading-tight max-w-[150px] truncate"
                              style={{ color: "var(--color-text-primary)" }}>{l.title}</div>
                            <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>#{l.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--color-text-secondary)" }}>
                        {l.category || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {l.quality_grade ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                            style={{ background: (gradeColor[l.quality_grade] ?? "#6B7280") + "18", color: gradeColor[l.quality_grade] ?? "#6B7280", border: `1px solid ${(gradeColor[l.quality_grade] ?? "#6B7280")}30` }}>
                            <Star size={9} fill="currentColor" /> {l.quality_grade}
                          </span>
                        ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm" style={{ color: "var(--color-accent-green)" }}>
                          ₹{Number(l.price).toLocaleString("en-IN")}
                        </span>
                        {l.original_price && Number(l.original_price) > 0 && (
                          <div className="text-[10px] line-through" style={{ color: "var(--color-text-muted)" }}>
                            ₹{Number(l.original_price).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.location ? (
                          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            <MapPin size={10} /> {l.location}
                          </span>
                        ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {l.seller_display_name || l.seller_name || "—"}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{l.seller_email || ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          <Eye size={11} /> {l.views ?? 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
