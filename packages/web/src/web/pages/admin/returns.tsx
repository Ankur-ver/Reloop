import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { AdminLayout } from "./layout";
import {
  RefreshCcw, CheckCircle, Package, Heart, Recycle,
  ArrowLeftRight, Zap, Search, TrendingUp, Award, X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "rgba(5,10,20,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "8px 12px",
  color: "#fff",
  fontSize: 12,
};

const dispositionConfig: Record<string, { label: string; color: string; icon: any }> = {
  resell:    { label: "Resell",    color: "#22C55E", icon: Package },
  refurbish: { label: "Refurbish", color: "#3B82F6", icon: Zap },
  donate:    { label: "Donate",    color: "#F59E0B", icon: Heart },
  recycle:   { label: "Recycle",   color: "#6B7280", icon: Recycle },
  exchange:  { label: "Exchange",  color: "#8B5CF6", icon: ArrowLeftRight },
};

const gradeColors: Record<string, string> = {
  excellent: "#22C55E", good: "#3B82F6", fair: "#F59E0B", poor: "#EF4444",
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = 0;
    const end = value;
    const dur = 900;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(start + ease * (end - start)));
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

export default function AdminReturns() {
  const [search, setSearch] = useState("");
  const [dispFilter, setDispFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns"],
    queryFn: async () => {
      const res = await (api as any).admin.returns.$get();
      return res.json();
    },
  });

  const returns: any[] = data?.returns ?? [];

  const filtered = returns.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || r.product_name?.toLowerCase().includes(q)
      || r.brand?.toLowerCase().includes(q)
      || r.user_email?.toLowerCase().includes(q);
    const matchDisp = dispFilter === "all" || r.disposition === dispFilter;
    const matchGrade = gradeFilter === "all" || r.quality_grade === gradeFilter;
    return matchSearch && matchDisp && matchGrade;
  });

  const dispCounts = returns.reduce((acc, r) => {
    if (r.disposition) acc[r.disposition] = (acc[r.disposition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeCounts = returns.reduce((acc, r) => {
    if (r.quality_grade) acc[r.quality_grade] = (acc[r.quality_grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCredits = returns.reduce((s, r) => s + (r.green_credits_awarded || 0), 0);
  const avgScore = returns.length
    ? Math.round(returns.reduce((s, r) => s + (r.quality_score || 0), 0) / returns.length)
    : 0;

  const pieData = Object.entries(dispCounts).map(([key, val]) => ({
    name: dispositionConfig[key]?.label ?? key,
    value: val as number,
    color: dispositionConfig[key]?.color ?? "#6B7280",
  }));

  const gradeBarData = ["excellent", "good", "fair", "poor"].map((g) => ({
    grade: g.charAt(0).toUpperCase() + g.slice(1),
    count: gradeCounts[g] || 0,
    color: gradeColors[g],
  }));

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCcw size={20} style={{ color: "var(--color-accent-green)" }} />
            <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>Return Submissions</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            All customer returns with AI quality grading and disposition recommendations
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Returns", value: returns.length, icon: RefreshCcw, color: "#3B82F6" },
            { label: "Green Credits Issued", value: totalCredits, icon: Award, color: "#F59E0B", prefix: "" },
            { label: "Avg Quality Score", value: avgScore, icon: TrendingUp, color: "#8B5CF6", suffix: "/100" },
            { label: "Unique Dispositions", value: Object.keys(dispCounts).length, icon: CheckCircle, color: "#22C55E" },
          ].map(({ label, value, icon: Icon, color, prefix, suffix }) => (
            <div
              key={label}
              className="p-5 rounded-2xl border flex items-start gap-4"
              style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-black leading-none mb-1" style={{ color }}>
                  <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {returns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Disposition pie */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Disposition Breakdown</div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{d.name}</span>
                      <span className="text-xs font-bold ml-auto" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade bar */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Quality Grade Distribution</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={gradeBarData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {gradeBarData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative" style={{ minWidth: 240 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          {/* Disposition tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {["all", ...Object.keys(dispositionConfig)].map((d) => {
              const dc = dispositionConfig[d];
              const count = d === "all" ? returns.length : dispCounts[d] || 0;
              const active = dispFilter === d;
              return (
                <button key={d} onClick={() => setDispFilter(d)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? (dc?.color ?? "#22C55E") + "20" : "var(--color-bg-elevated)",
                    color: active ? (dc?.color ?? "#22C55E") : "var(--color-text-muted)",
                    border: `1px solid ${active ? (dc?.color ?? "#22C55E") + "50" : "var(--color-border)"}`,
                  }}>
                  {d === "all" ? "All" : dc?.label} ({count})
                </button>
              );
            })}
          </div>
          {/* Grade tabs */}
          <div className="flex gap-1.5">
            {["all", "excellent", "good", "fair", "poor"].map((g) => {
              const color = gradeColors[g] ?? "#22C55E";
              const active = gradeFilter === g;
              return (
                <button key={g} onClick={() => setGradeFilter(g)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize"
                  style={{
                    background: active ? color + "20" : "var(--color-bg-elevated)",
                    color: active ? color : "var(--color-text-muted)",
                    border: `1px solid ${active ? color + "50" : "var(--color-border)"}`,
                  }}>
                  {g}
                </button>
              );
            })}
          </div>
          {filtered.length !== returns.length && (
            <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
              {filtered.length} of {returns.length}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)" }}>
                {["Product", "Customer", "Return Reason", "AI Grade", "Disposition", "Credits", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(6).fill(0).map((_, i) => (
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
                      <td colSpan={8} className="px-4 py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No returns match your filters
                      </td>
                    </tr>
                  )
                  : filtered.map((r) => {
                    const dc = dispositionConfig[r.disposition] ?? dispositionConfig.resell;
                    const DIcon = dc.icon;
                    const gc = gradeColors[r.quality_grade] ?? "#6B7280";
                    return (
                      <tr key={r.id} onClick={() => setSelected(r)}
                        className="border-t cursor-pointer transition-colors"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg-card)")}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{r.product_name}</div>
                          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.brand} · {r.category}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{r.user_name || "Guest"}</div>
                          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.user_email || "—"}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <div className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>{r.return_reason || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          {r.quality_grade ? (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                                style={{ background: gc + "20", color: gc }}>{r.quality_grade}</span>
                              <div className="mt-1 flex items-center gap-1.5">
                                <div className="w-14 h-1 rounded-full" style={{ background: "var(--color-border)" }}>
                                  <div className="h-1 rounded-full" style={{ width: `${r.quality_score}%`, background: gc }} />
                                </div>
                                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{r.quality_score}</span>
                              </div>
                            </>
                          ) : <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Pending</span>}
                        </td>
                        <td className="px-4 py-3">
                          {r.disposition ? (
                            <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-semibold"
                              style={{ background: dc.color + "15", color: dc.color }}>
                              <DIcon size={10} /> {dc.label}
                            </span>
                          ) : <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-sm" style={{ color: "#F59E0B" }}>+{r.green_credits_awarded || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {r.created_at
                            ? new Date(typeof r.created_at === "number" ? r.created_at * 1000 : r.created_at).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: "var(--color-bg-elevated)", color: "var(--color-accent-green)" }}>
                            View
                          </span>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-accent-green)" }}>RETURN #{selected.id}</div>
                  <h3 className="font-bold" style={{ color: "var(--color-text-primary)" }}>{selected.product_name}</h3>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}>
                  <X size={14} />
                </button>
              </div>

              {/* Grade + disposition hero */}
              <div className="grid grid-cols-2 gap-3 px-6 pt-5">
                {selected.quality_grade && (
                  <div className="p-4 rounded-xl" style={{ background: (gradeColors[selected.quality_grade] ?? "#6B7280") + "10", border: `1px solid ${(gradeColors[selected.quality_grade] ?? "#6B7280")}25` }}>
                    <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>AI Grade</div>
                    <div className="text-lg font-black capitalize" style={{ color: gradeColors[selected.quality_grade] ?? "#6B7280" }}>{selected.quality_grade}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Score: {selected.quality_score}/100 · Conf: {selected.confidence_score}%</div>
                  </div>
                )}
                {selected.disposition && (() => {
                  const dc = dispositionConfig[selected.disposition];
                  const DIcon = dc?.icon ?? Package;
                  return (
                    <div className="p-4 rounded-xl" style={{ background: (dc?.color ?? "#22C55E") + "10", border: `1px solid ${dc?.color ?? "#22C55E"}25` }}>
                      <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Disposition</div>
                      <div className="flex items-center gap-2">
                        <DIcon size={16} style={{ color: dc?.color ?? "#22C55E" }} />
                        <span className="text-lg font-black" style={{ color: dc?.color ?? "#22C55E" }}>{dc?.label ?? selected.disposition}</span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#F59E0B" }}>+{selected.green_credits_awarded} credits</div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-6 space-y-3">
                {[
                  ["Brand", selected.brand],
                  ["Category", selected.category],
                  ["Purchase Date", selected.purchase_date],
                  ["Return Reason", selected.return_reason],
                  ["Customer", `${selected.user_name || "Guest"} — ${selected.user_email || "—"}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold flex-shrink-0 w-28" style={{ color: "var(--color-text-muted)" }}>{k}</span>
                    <span className="text-sm text-right" style={{ color: "var(--color-text-primary)" }}>{v || "—"}</span>
                  </div>
                ))}
                {selected.ai_reasoning && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>AI REASONING</div>
                    <div className="text-xs p-3 rounded-xl leading-relaxed"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                      {selected.ai_reasoning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
