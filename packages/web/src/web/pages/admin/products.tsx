import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import {
  Package, Star, CheckCircle, Clock, XCircle, RefreshCcw,
  ShoppingBag, Search, TrendingUp, Eye, Award,
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
  active: { label: "Active", color: "#22C55E", icon: CheckCircle },
  sold: { label: "Sold", color: "#3B82F6", icon: ShoppingBag },
  pending: { label: "Pending", color: "#EAB308", icon: Clock },
  unavailable: { label: "Unavailable", color: "#6B7280", icon: XCircle },
  refurbishing: { label: "Refurbishing", color: "#8B5CF6", icon: RefreshCcw },
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

function GradeBadge({ grade }: { grade: string }) {
  const color = gradeColor[grade] ?? "#6B7280";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: color + "18", color, border: `1px solid ${color}30` }}>
      <Star size={9} fill="currentColor" /> {grade}
    </span>
  );
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [certFilter, setCertFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ products: any[] }>;
    },
  });

  const products = data?.products ?? [];

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.title?.toLowerCase().includes(q)
      || p.brand?.toLowerCase().includes(q)
      || p.category?.toLowerCase().includes(q);
    const matchGrade = gradeFilter === "all" || p.quality_grade === gradeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchCert = certFilter === "all"
      || (certFilter === "certified" && p.is_certified)
      || (certFilter === "standard" && !p.is_certified);
    return matchSearch && matchGrade && matchStatus && matchCert;
  });

  const gradeCounts = ["excellent", "good", "fair", "poor"].map((g) => ({
    grade: g.charAt(0).toUpperCase() + g.slice(1),
    count: products.filter((p) => p.quality_grade === g).length,
    color: gradeColor[g],
  }));

  const statusCounts = products.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusPieData = Object.entries(statusCounts).map(([key, val]) => ({
    name: statusConfig[key]?.label ?? key,
    value: val as number,
    color: statusConfig[key]?.color ?? "#6B7280",
  }));

  const totalValue = products.reduce((s, p) => s + (Number(p.reloop_price) || 0), 0);
  const certifiedCount = products.filter((p) => p.is_certified).length;
  const totalViews = products.reduce((s, p) => s + (p.views ?? 0), 0);

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Package size={20} style={{ color: "var(--color-accent-green)" }} />
            <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>Products</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            All marketplace &amp; certified refurbished listings
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Products", value: products.length, icon: Package, color: "#3B82F6" },
            { label: "Certified", value: certifiedCount, icon: Award, color: "#22C55E" },
            { label: "Total Views", value: totalViews, icon: Eye, color: "#06B6D4" },
            { label: "Catalog Value", value: Math.round(totalValue / 1000), icon: TrendingUp, color: "#F59E0B", suffix: "K" },
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

        {/* Charts */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Grade bar */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Grade Distribution</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={gradeCounts} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" name="Products" radius={[6, 6, 0, 0]}>
                    {gradeCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Status Breakdown</div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3}>
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
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, category…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
          {/* Grade filter */}
          <div className="flex gap-1.5">
            {["all", "excellent", "good", "fair", "poor"].map((g) => {
              const color = gradeColor[g] ?? "#22C55E";
              const active = gradeFilter === g;
              return (
                <button key={g} onClick={() => setGradeFilter(g)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                  style={{
                    background: active ? color + "20" : "var(--color-bg-elevated)",
                    color: active ? color : "var(--color-text-muted)",
                    border: `1px solid ${active ? color + "50" : "var(--color-border)"}`,
                  }}>{g}</button>
              );
            })}
          </div>
          {/* Status filter */}
          <div className="flex gap-1.5">
            {["all", ...Object.keys(statusConfig)].map((s) => {
              const cfg = statusConfig[s];
              const count = s === "all" ? products.length : statusCounts[s] || 0;
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? (cfg?.color ?? "#22C55E") + "20" : "var(--color-bg-elevated)",
                    color: active ? (cfg?.color ?? "#22C55E") : "var(--color-text-muted)",
                    border: `1px solid ${active ? (cfg?.color ?? "#22C55E") + "50" : "var(--color-border)"}`,
                  }}>{s === "all" ? "All" : cfg?.label} ({count})</button>
              );
            })}
          </div>
          {/* Certified toggle */}
          <div className="flex gap-1.5 ml-auto">
            {["all", "certified", "standard"].map((c) => (
              <button key={c} onClick={() => setCertFilter(c)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: certFilter === c ? "#22C55E20" : "var(--color-bg-elevated)",
                  color: certFilter === c ? "#22C55E" : "var(--color-text-muted)",
                  border: `1px solid ${certFilter === c ? "#22C55E50" : "var(--color-border)"}`,
                }}>{c}</button>
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
            <div className="text-center py-20 text-sm" style={{ color: "#EF4444" }}>Failed to load products</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ color: "var(--color-text-muted)" }}>No products match your filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}>
                    {["Product", "Brand", "Category", "Grade", "ReLoop Price", "Original", "Savings", "Status", "Views"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
                        style={{ color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any, i: number) => {
                    const orig = Number(p.original_price) || 0;
                    const reloop = Number(p.reloop_price) || 0;
                    const savings = orig > 0 ? Math.round(((orig - reloop) / orig) * 100) : 0;
                    return (
                      <tr key={p.id}
                        className="transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.title}
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
                                style={{ color: "var(--color-text-primary)" }}>{p.title}</div>
                              {p.is_certified ? (
                                <span className="text-[10px] font-semibold" style={{ color: "#22C55E" }}>✓ Certified</span>
                              ) : (
                                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>#{p.id}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{p.brand || "—"}</td>
                        <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--color-text-secondary)" }}>{p.category || "—"}</td>
                        <td className="px-4 py-3">
                          {p.quality_grade ? <GradeBadge grade={p.quality_grade} /> : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-sm" style={{ color: "var(--color-accent-green)" }}>
                            ₹{reloop.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs line-through" style={{ color: "var(--color-text-muted)" }}>
                            ₹{orig.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {savings > 0 ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "#22C55E15", color: "#22C55E" }}>-{savings}%</span>
                          ) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                            <Eye size={11} /> {p.views ?? 0}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
