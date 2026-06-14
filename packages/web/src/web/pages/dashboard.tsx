import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Coins, Leaf, RefreshCcw, ShoppingBag, Globe, Zap, Heart,
  Recycle, ArrowLeftRight, BarChart3, Truck, Store, Pencil,
  X, AlertCircle, Eye, TrendingUp, Award, Sparkles, ArrowUpRight,
  ChevronRight, Package, CheckCircle2, Circle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { getToken } from "../lib/auth";
const API_URL = import.meta.env.VITE_API_URL;
// ─── Configs ────────────────────────────────────────────────────────────────

const dispositionConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  resell: { label: "Resell", color: "#22C55E", bg: "rgba(34,197,94,0.1)", icon: ShoppingBag },
  refurbish: { label: "Refurbish", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Zap },
  donate: { label: "Donate", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: Heart },
  recycle: { label: "Recycle", color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: Recycle },
  exchange: { label: "Exchange", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", icon: ArrowLeftRight },
};

const gradeConfig: Record<string, { color: string; label: string }> = {
  excellent: { color: "#22C55E", label: "Excellent" },
  good: { color: "#3B82F6", label: "Good" },
  fair: { color: "#F59E0B", label: "Fair" },
  poor: { color: "#EF4444", label: "Poor" },
};

const returnStatusConfig: Record<string, { label: string; color: string }> = {
  initiated: { label: "Initiated", color: "#8B5CF6" },
  pickup_scheduled: { label: "Pickup Scheduled", color: "#3B82F6" },
  picked_up: { label: "Picked Up", color: "#F59E0B" },
  in_transit: { label: "In Transit", color: "#F59E0B" },
  processed: { label: "Processed", color: "#22C55E" },
  listed: { label: "Listed", color: "#22C55E" },
  donated: { label: "Donated", color: "#F59E0B" },
  recycled: { label: "Recycled", color: "#6B7280" },
};

const listingStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  sold: { label: "Sold", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  expired: { label: "Expired", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const CHART_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

const conditionOptions = ["Like New", "Excellent", "Good", "Fair", "Poor"];
const statusOptions = ["active", "sold", "expired"];

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-IN");
  return <>{formatted}{suffix}</>;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, suffix, decimals, trend }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden p-5 rounded-2xl cursor-default transition-all duration-300"
      style={{
        background: hovered ? `linear-gradient(135deg, ${color}18, ${color}08)` : "var(--color-bg-card)",
        border: `1px solid ${hovered ? color + "50" : "var(--color-border)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px ${color}20` : "none",
      }}
    >
      {/* Glow blob */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl transition-opacity duration-300"
        style={{ background: color, opacity: hovered ? 0.35 : 0.1 }} />

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{ background: hovered ? `${color}25` : `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color, fontFamily: "JetBrains Mono" }}>
        <AnimatedCounter value={typeof value === "number" ? value : 0} suffix={suffix} decimals={decimals} />
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: trend >= 0 ? "#22C55E" : "#EF4444" }}>
          <TrendingUp size={11} />
          <span>{trend >= 0 ? "+" : ""}{trend}% this month</span>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-xs shadow-xl"
      style={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(12px)" }}>
      <div className="font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#aaa" }}>{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Edit Listing Modal ──────────────────────────────────────────────────────

function EditListingModal({ listing, onClose, onSaved }: { listing: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description,
    price: listing.price,
    condition: listing.condition,
    location: listing.location,
    status: listing.status,
  });
  const imageUrl =
    listing.imageUrl?.startsWith("/api/")
      ? `${API_URL}${listing.imageUrl}`
      : listing.imageUrl;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 10); }, []);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/p2p/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) throw new Error();
      onSaved(); onClose();
    } catch { setError("Failed to save. Try again."); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: `rgba(0,0,0,${mounted ? 0.75 : 0})`, backdropFilter: "blur(10px)", transition: "background 0.2s" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl p-6 transition-all duration-300"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          opacity: mounted ? 1 : 0,
        }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
              <Pencil size={14} style={{ color: "var(--color-accent-green)" }} />
            </div>
            <span className="font-semibold text-lg" style={{ color: "var(--color-text-primary)" }}>Edit Listing</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "var(--color-bg-elevated)" }}>
            <X size={15} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
          <img src={imageUrl} alt={listing.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          <div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{listing.category}</div>
            <div className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{listing.title}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Condition</label>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
                {conditionOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
              {statusOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#EF4444" }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
          <Icon size={15} style={{ color: "var(--color-accent-green)" }} />
        </div>
        <span className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

// ─── Return Tracking Stepper ─────────────────────────────────────────────────

const RETURN_STAGES: { key: string; label: string }[] = [
  { key: "initiated", label: "Initiated" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "picked_up", label: "Picked Up" },
  { key: "in_transit", label: "In Transit" },
  { key: "processed", label: "Processed" },
  { key: "listed", label: "Completed" }, // covers listed/donated/recycled
];

// Map terminal statuses to the last stage index
function getStageIndex(status: string): number {
  const terminalMap: Record<string, number> = { listed: 5, donated: 5, recycled: 5 };
  if (terminalMap[status] !== undefined) return terminalMap[status];
  return RETURN_STAGES.findIndex((s) => s.key === status);
}

function ReturnTrackingCard({ r }: { r: any }) {
  const [expanded, setExpanded] = useState(false);
  const disposition = dispositionConfig[r.disposition] || dispositionConfig.resell;
  const grade = gradeConfig[r.qualityGrade] || gradeConfig.good;
  const DispositionIcon = disposition.icon;
  const currentStageIdx = getStageIndex(r.returnStatus ?? "initiated");
  const trackStatus = returnStatusConfig[r.returnStatus] || returnStatusConfig.initiated;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
    >
      {/* ── Header row ── */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: disposition.bg }}>
          <DispositionIcon size={15} style={{ color: disposition.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {r.productName || "Returned Product"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
              RETURNED
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {[r.category, r.brand].filter(Boolean).join(" · ")}
            {r.createdAt && (
              <span> · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Current status pill */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: `${trackStatus.color}18` }}>
            <Truck size={10} style={{ color: trackStatus.color }} />
            <span className="text-[11px] font-semibold" style={{ color: trackStatus.color }}>
              {trackStatus.label}
            </span>
          </div>
          {/* Credits */}
          {r.greenCreditsAwarded > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "#F59E0B", fontFamily: "JetBrains Mono" }}>
              <Coins size={12} />+{r.greenCreditsAwarded}
            </div>
          )}
          <div style={{ color: "var(--color-text-muted)" }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </button>

      {/* ── Expanded: Stepper ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-1">
          {/* Horizontal stepper — desktop */}
          <div className="hidden sm:flex items-start justify-between relative">
            {/* connector line */}
            <div className="absolute top-3.5 left-0 right-0 h-px" style={{ background: "var(--color-border)", zIndex: 0 }} />
            <div
              className="absolute top-3.5 left-0 h-px transition-all duration-500"
              style={{
                background: "var(--color-accent-green)",
                zIndex: 1,
                width: currentStageIdx <= 0
                  ? "0%"
                  : `${(currentStageIdx / (RETURN_STAGES.length - 1)) * 100}%`,
              }}
            />
            {RETURN_STAGES.map((stage, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              return (
                <div key={stage.key} className="flex flex-col items-center gap-1.5 relative z-10" style={{ width: `${100 / RETURN_STAGES.length}%` }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: done || active ? "var(--color-accent-green)" : "var(--color-bg-card)",
                      border: done || active ? "2px solid var(--color-accent-green)" : "2px solid var(--color-border)",
                      boxShadow: active ? "0 0 0 4px rgba(34,197,94,0.15)" : "none",
                    }}
                  >
                    {done ? (
                      <CheckCircle2 size={14} color="#0A0F1E" />
                    ) : active ? (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#0A0F1E" }} />
                    ) : (
                      <Circle size={14} style={{ color: "var(--color-border)" }} />
                    )}
                  </div>
                  <span
                    className="text-[10px] text-center leading-tight font-medium"
                    style={{ color: done || active ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Vertical stepper — mobile */}
          <div className="flex sm:hidden flex-col gap-0">
            {RETURN_STAGES.map((stage, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              const isLast = i === RETURN_STAGES.length - 1;
              return (
                <div key={stage.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: done || active ? "var(--color-accent-green)" : "var(--color-bg-card)",
                        border: done || active ? "2px solid var(--color-accent-green)" : "2px solid var(--color-border)",
                        boxShadow: active ? "0 0 0 3px rgba(34,197,94,0.15)" : "none",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={12} color="#0A0F1E" />
                      ) : active ? (
                        <div className="w-2 h-2 rounded-full" style={{ background: "#0A0F1E" }} />
                      ) : (
                        <Circle size={12} style={{ color: "var(--color-border)" }} />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 my-1" style={{ background: i < currentStageIdx ? "var(--color-accent-green)" : "var(--color-border)", minHeight: "16px" }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: done || active ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                    >
                      {stage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom meta row ── */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: disposition.bg, color: disposition.color }}>
              {disposition.label}
            </div>
            <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${grade.color}18`, color: grade.color }}>
              Grade: {grade.label}
            </div>
            {r.greenCreditsAwarded > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontFamily: "JetBrains Mono" }}>
                <Coins size={11} /> +{r.greenCreditsAwarded} Green Credits
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentReturnsSection({ recentReturns }: { recentReturns: any[] }) {
  return (
    <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <SectionHeader
        icon={RefreshCcw}
        title="Recent Returns"
        action={
          <Link to="/return">
            <span className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: "var(--color-accent-green)" }}>
              View All <ChevronRight size={12} />
            </span>
          </Link>
        }
      />

      {recentReturns.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCcw size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm mb-4">No returns yet. Submit your first return to get started.</p>
          <Link to="/return">
            <button className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-105"
              style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
              Submit Return
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mt-1">
          {recentReturns.map((r: any) => (
            <ReturnTrackingCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [editListing, setEditListing] = useState<any | null>(null);
  const [activeChart, setActiveChart] = useState<"returns" | "credits" | "co2">("returns");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.dashboard.stats.$get()).json(),
  });

  const { data: myListingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-p2p-listings"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/p2p/my-listings`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 rounded-xl w-1/3" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--color-bg-elevated)" }} />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl" style={{ background: "var(--color-bg-elevated)" }} />)}
          </div>
        </div>
      </div>
    );
  }

  const { stats, dispositionBreakdown, recentReturns, user, monthlyTrend, categoryBreakdown, gradeBreakdown } = data as any;

  const totalDispositions = Object.values(dispositionBreakdown as Record<string, number>).reduce((a: any, b: any) => a + b, 0);

  const dispositionPieData = Object.entries(dispositionBreakdown as Record<string, number>)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: dispositionConfig[key]?.label || key, value, color: dispositionConfig[key]?.color || "#888" }));

  const chartDataKey = activeChart === "returns" ? "returns" : activeChart === "credits" ? "credits" : "co2";
  const chartColor = activeChart === "returns" ? "#22C55E" : activeChart === "credits" ? "#F59E0B" : "#3B82F6";
  const chartLabel = activeChart === "returns" ? "Returns" : activeChart === "credits" ? "Green Credits" : "CO₂ (kg)";

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: "var(--color-accent-green)" }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-accent-green)" }}>Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {user?.name || "Ankur Verma"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Your sustainability impact at a glance.
          </p>
        </div>
        <Link to="/return">
          <button className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-105 active:scale-95"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
            <RefreshCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
            New Return
          </button>
        </Link>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Returns" value={stats.totalReturns} icon={RefreshCcw} color="#22C55E" suffix="" />
        <StatCard label="Green Credits" value={stats.greenCredits} icon={Coins} color="#F59E0B" suffix="" />
        <StatCard label="CO₂ Saved" value={stats.co2SavedKg} icon={Globe} color="#3B82F6" suffix="kg" decimals={1} />
        <StatCard label="Active Listings" value={stats.activeListings || stats.activeProducts || 0} icon={ShoppingBag} color="#8B5CF6" suffix="" />
      </div>

      {/* ── Trend Chart + Disposition Pie ── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Area Chart */}
        <div className="md:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <SectionHeader icon={TrendingUp} title="Activity Trend" />

          {/* Chart Tabs */}
          <div className="flex gap-2 mb-5">
            {(["returns", "credits", "co2"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveChart(tab)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: activeChart === tab
                    ? (tab === "returns" ? "rgba(34,197,94,0.15)" : tab === "credits" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)")
                    : "var(--color-bg-elevated)",
                  color: activeChart === tab
                    ? (tab === "returns" ? "#22C55E" : tab === "credits" ? "#F59E0B" : "#3B82F6")
                    : "var(--color-text-muted)",
                  border: activeChart === tab
                    ? `1px solid ${tab === "returns" ? "rgba(34,197,94,0.3)" : tab === "credits" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`
                    : "1px solid transparent",
                }}>
                {tab === "returns" ? "Returns" : tab === "credits" ? "Credits" : "CO₂ Saved"}
              </button>
            ))}
          </div>

          {monthlyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey={chartDataKey} name={chartLabel}
                  stroke={chartColor} strokeWidth={2.5}
                  fill="url(#chartGrad)" dot={{ fill: chartColor, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: chartColor, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
              <div className="text-center">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No data yet — submit your first return</p>
              </div>
            </div>
          )}
        </div>

        {/* Disposition Pie */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <SectionHeader icon={BarChart3} title="Disposition Mix" />

          {dispositionPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={dispositionPieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {dispositionPieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {dispositionPieData.map((item: any) => {
                  const pct = totalDispositions ? Math.round((item.value / totalDispositions) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--color-text-secondary)" }}>{item.name}</span>
                        <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "var(--color-border)" }}>
                        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
              <div className="text-center text-sm opacity-50">No dispositions yet</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Bar Chart + Grade Radial ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Category Bar Chart */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <SectionHeader icon={Package} title="Returns by Category" />
          {categoryBreakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryBreakdown} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Returns" radius={[6, 6, 0, 0]}>
                  {categoryBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              No category data yet
            </div>
          )}
        </div>

        {/* Grade Breakdown */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <SectionHeader icon={Award} title="Quality Grade Breakdown" />
          {gradeBreakdown?.length > 0 ? (
            <div className="space-y-4 mt-2">
              {gradeBreakdown.map(({ grade, count }: any) => {
                const cfg = gradeConfig[grade] || { color: "#888", label: grade };
                const maxCount = Math.max(...gradeBreakdown.map((g: any) => g.count));
                const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <div key={grade}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: cfg.color, fontFamily: "JetBrains Mono" }}>{count}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              No grade data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Returns ── */}
      <RecentReturnsSection recentReturns={recentReturns} />

      {/* ── Impact Banner ── */}
      <div className="relative overflow-hidden p-6 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(59,130,246,0.06))", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "#22C55E", transform: "translate(30%, -30%)" }} />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={16} style={{ color: "var(--color-accent-green)" }} />
              <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Your Environmental Impact</span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              You've helped prevent <strong style={{ color: "var(--color-accent-green)" }}>{stats.co2SavedKg}kg of CO₂</strong> emissions
              and kept <strong style={{ color: "var(--color-accent-green)" }}>{stats.totalReturns} products</strong> out of landfill.
            </p>
          </div>
          <div className="flex gap-8">
            {[
              { value: stats.totalReturns, label: "Products saved", color: "var(--color-accent-green)" },
              { value: `${stats.co2SavedKg}kg`, label: "CO₂ avoided", color: "#3B82F6" },
              { value: user?.totalDonations || 0, label: "Donated", color: "#F59E0B" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold" style={{ color, fontFamily: "JetBrains Mono" }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── My P2P Listings ── */}
      <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <SectionHeader
          icon={Store}
          title={
            <span className="flex items-center gap-2">
              My P2P Listings
              {myListingsData?.listings?.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "var(--color-accent-green)" }}>
                  {myListingsData.listings.length}
                </span>
              )}
            </span> as any
          }
          action={
            <Link to="/p2p">
              <span className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-70" style={{ color: "var(--color-accent-green)" }}>
                Browse P2P <ChevronRight size={12} />
              </span>
            </Link>
          }
        />

        {listingsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />)}
          </div>
        ) : !myListingsData?.listings?.length ? (
          <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
            <Store size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm mb-1">No listings yet.</p>
            <p className="text-xs mb-4">List a returned product on P2P to sell it directly.</p>
            <Link to="/p2p">
              <button className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:scale-105"
                style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                Go to P2P Marketplace
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {(myListingsData.listings as any[]).map((listing, idx) => {
              const statusCfg = listingStatusConfig[listing.status] || listingStatusConfig.active;
              const imgs: string[] = (() => { try { return JSON.parse(listing.imageUrls || "[]"); } catch { return []; } })();
              const thumb = imgs[0] || listing.imageUrl;
              return (
                <div key={listing.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200"
                  style={{ background: "var(--color-bg-elevated)", animationDelay: `${idx * 60}ms` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"; }}
                >
                  <img src={thumb} alt={listing.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{listing.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                      {listing.category} · {listing.condition}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: "var(--color-accent-green)", fontFamily: "JetBrains Mono" }}>
                        ₹{listing.price.toLocaleString()}
                      </span>
                      {listing.originalPrice > listing.price && (
                        <span className="text-xs line-through" style={{ color: "var(--color-text-muted)" }}>₹{listing.originalPrice.toLocaleString()}</span>
                      )}
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>· {listing.views} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/product/${listing.id}`}>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <Eye size={13} style={{ color: "#3B82F6" }} />
                      </button>
                    </Link>
                    <button onClick={() => setEditListing(listing)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <Pencil size={13} style={{ color: "var(--color-accent-green)" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editListing && (
        <EditListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["my-p2p-listings"] })}
        />
      )}
    </div>
  );
}
