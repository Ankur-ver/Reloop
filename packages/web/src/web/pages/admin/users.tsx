import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import {
  User, Shield, Leaf, RefreshCcw, Award, Search, TrendingUp, Users,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "rgba(5,10,20,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "8px 12px",
  color: "#fff",
  fontSize: 12,
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    const dur = 900;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(ease * value));
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

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"credits" | "returns" | "name">("credits");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json() as Promise<{ users: any[] }>;
    },
  });

  const users = data?.users ?? [];

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || u.name?.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === "credits") return (b.green_credits ?? 0) - (a.green_credits ?? 0);
      if (sortBy === "returns") return (b.total_returns ?? 0) - (a.total_returns ?? 0);
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

  const admins = users.filter((u) => u.role === "admin").length;
  const totalCredits = users.reduce((s, u) => s + (u.green_credits ?? 0), 0);
  const totalReturns = users.reduce((s, u) => s + (u.total_returns ?? 0), 0);
  const avgCredits = users.length ? Math.round(totalCredits / users.length) : 0;

  // Top 10 by credits for chart
  const top10 = [...users]
    .sort((a, b) => (b.green_credits ?? 0) - (a.green_credits ?? 0))
    .slice(0, 10)
    .map((u) => ({
      name: (u.name || u.email || "?").split(" ")[0].slice(0, 8),
      credits: u.green_credits ?? 0,
      returns: u.total_returns ?? 0,
    }));

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} style={{ color: "var(--color-accent-green)" }} />
            <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>Users</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Registered accounts and engagement stats
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: users.length, icon: User, color: "#3B82F6" },
            { label: "Admin Accounts", value: admins, icon: Shield, color: "#EF4444" },
            { label: "Credits Issued", value: totalCredits, icon: Leaf, color: "#22C55E" },
            { label: "Total Returns", value: totalReturns, icon: RefreshCcw, color: "#8B5CF6" },
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

        {/* Charts */}
        {users.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Top users by credits */}
            <div className="col-span-2 p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Top Users by Green Credits</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Avg: {avgCredits.toLocaleString()} credits/user</div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={top10} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="credits" name="Credits" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role distribution */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Account Breakdown</div>
              <div className="space-y-4">
                {[
                  { label: "Regular Users", count: users.length - admins, color: "#3B82F6", icon: User },
                  { label: "Admins", count: admins, color: "#EF4444", icon: Shield },
                ].map(({ label, count, color, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={13} style={{ color }} />
                        <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--color-border)" }}>
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: users.length ? `${(count / users.length) * 100}%` : "0%", background: color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Avg credits per user</div>
                  <div className="text-xl font-black mt-0.5" style={{ color: "#22C55E" }}>{avgCredits.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "user", "admin"].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: roleFilter === r ? "#3B82F620" : "var(--color-bg-elevated)",
                  color: roleFilter === r ? "#3B82F6" : "var(--color-text-muted)",
                  border: `1px solid ${roleFilter === r ? "#3B82F650" : "var(--color-border)"}`,
                }}>
                {r === "all" ? "All Roles" : r}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <span className="text-xs self-center" style={{ color: "var(--color-text-muted)" }}>Sort:</span>
            {(["credits", "returns", "name"] as const).map((s) => (
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ color: "var(--color-text-muted)" }}>No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}>
                    {["User", "Email", "Role", "Green Credits", "Returns", "Credits Bar", "Member Since"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u: any, i: number) => {
                    const maxCredits = Math.max(...users.map((x: any) => x.green_credits ?? 0), 1);
                    const pct = Math.round(((u.green_credits ?? 0) / maxCredits) * 100);
                    return (
                      <tr key={u.id}
                        className="transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: u.role === "admin" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.12)",
                                color: u.role === "admin" ? "#EF4444" : "var(--color-accent-green)",
                              }}>
                              {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold max-w-[130px] truncate" style={{ color: "var(--color-text-primary)" }}>
                              {u.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{u.email}</span>
                        </td>
                        <td className="px-5 py-3">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                              <Shield size={9} /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(100,100,100,0.12)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                              <User size={9} /> User
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--color-accent-green)" }}>
                            <Leaf size={11} /> {(u.green_credits ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#8B5CF6" }}>
                            <RefreshCcw size={10} /> {u.total_returns ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3" style={{ minWidth: 100 }}>
                          <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                            <div className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: "var(--color-accent-green)" }} />
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{pct}% of top</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </span>
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
