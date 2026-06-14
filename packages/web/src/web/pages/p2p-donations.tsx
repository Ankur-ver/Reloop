import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Heart, CheckCircle, XCircle, Star, Recycle, ChevronDown, ChevronUp,
  Leaf, Zap, Droplets, CircleDot, Building, School, Home, Users, Search
} from "lucide-react";

function parseJSON(str: string | null | undefined, fallback: any = []) {
  if (!str) return fallback;
  try {
    let val = typeof str === "string" ? JSON.parse(str) : str;
    // Handle double-encoded strings (e.g. "\"[...]\"")
    if (typeof val === "string") val = JSON.parse(val);
    return val;
  } catch { return fallback; }
}

const gradeConfig: Record<string, { color: string; label: string }> = {
  excellent: { color: "#22C55E", label: "Excellent" },
  good: { color: "#3B82F6", label: "Good" },
  fair: { color: "#F59E0B", label: "Fair" },
  poor: { color: "#EF4444", label: "Poor" },
};

const recipientIcon: Record<string, any> = {
  ngo: Heart, school: School, shelter: Home, community: Users,
};

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "#F59E0B", label: "Pending Pickup" },
  accepted: { color: "#3B82F6", label: "Accepted" },
  delivered: { color: "#22C55E", label: "Delivered" },
};

function AIAnalysisPanel({ donation }: { donation: any }) {
  const [open, setOpen] = useState(false);
  const positives: string[] = parseJSON(donation.aiPositives);
  const concerns: string[] = parseJSON(donation.aiConcerns);
  const recycleData = parseJSON(donation.recycleData, null);
  const materials: any[] = recycleData?.materials || [];
  const parts: any[] = recycleData?.parts || [];
  const impact = recycleData?.environmentalImpact || {};
  const grade = gradeConfig[donation.qualityGrade] || gradeConfig.good;

  return (
    <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="flex items-center gap-2">
          <Star size={14} style={{ color: "#8B5CF6" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>AI Analysis Report</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.color + "20", color: grade.color }}>
            {grade.label}
          </span>
          {donation.aiScore != null && (
            <span className="text-xs" style={{ color: "#8B5CF6" }}>{donation.aiScore}/100</span>
          )}
        </div>
        {open ? <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-text-muted)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4" style={{ background: "var(--color-bg-card)" }}>
          {/* Score bar */}
          {donation.aiScore != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Quality Score</span>
                <span className="text-xs font-bold" style={{ color: grade.color }}>{donation.aiScore}/100</span>
              </div>
              <div className="h-2 rounded-full w-full" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="h-2 rounded-full" style={{ width: `${donation.aiScore}%`, background: grade.color }} />
              </div>
            </div>
          )}

          {/* Verdict */}
          {donation.aiVerdict && (
            <p className="text-xs italic px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
              "{donation.aiVerdict}"
            </p>
          )}

          {/* Positives */}
          {positives.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: "#22C55E" }}>What looks good</div>
              <div className="space-y-1">
                {positives.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <CheckCircle size={11} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} /> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {concerns.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: "#F59E0B" }}>Concerns noted</div>
              <div className="space-y-1">
                {concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <CircleDot size={11} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} /> {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {donation.aiReasoning && (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "#8B5CF6" }}>AI: </span>
              {donation.aiReasoning}
            </p>
          )}

          {/* Recyclability section */}
          <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Recycle size={13} style={{ color: donation.isRecyclable ? "#22C55E" : "#6B7280" }} />
              <span className="text-xs font-semibold" style={{ color: donation.isRecyclable ? "#22C55E" : "#6B7280" }}>
                {donation.isRecyclable ? "Recyclable" : "Not Easily Recyclable"}
              </span>
              {recycleData?.recycleScore != null && (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>· Score: {recycleData.recycleScore}/100</span>
              )}
            </div>

            {recycleData?.recyclingReason && (
              <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>{recycleData.recyclingReason}</p>
            )}

            {/* Materials bar */}
            {materials.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Material Composition</div>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-2">
                  {materials.map((m, i) => (
                    <div key={i} style={{ width: `${m.percentage}%`, background: m.color || "#3B82F6", minWidth: 2 }} title={`${m.name}: ${m.percentage}%`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color || "#3B82F6" }} />
                      <span style={{ color: "var(--color-text-secondary)" }}>{m.name} {m.percentage}%</span>
                      {m.recyclable
                        ? <CheckCircle size={9} style={{ color: "#22C55E" }} />
                        : <XCircle size={9} style={{ color: "#EF4444" }} />
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parts */}
            {parts.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Parts</div>
                <div className="space-y-1.5">
                  {parts.map((p, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {p.recyclable
                          ? <CheckCircle size={10} style={{ color: "#22C55E" }} />
                          : <XCircle size={10} style={{ color: "#EF4444" }} />
                        }
                        <span style={{ color: "var(--color-text-primary)" }}>{p.name}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>({p.material})</span>
                      </div>
                      <span className="text-right shrink-0 max-w-[150px]" style={{ color: "var(--color-text-muted)" }}>{p.disposalMethod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environmental impact */}
            {(impact.co2SavedKg || impact.waterSavedL || impact.energySavedKwh) ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Leaf, label: "CO₂ Saved", value: `${impact.co2SavedKg}kg`, color: "#22C55E" },
                  { icon: Droplets, label: "Water", value: `${impact.waterSavedL}L`, color: "#3B82F6" },
                  { icon: Zap, label: "Energy", value: `${impact.energySavedKwh}kWh`, color: "#F59E0B" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-2 rounded-lg text-center" style={{ background: "var(--color-bg-elevated)" }}>
                    <Icon size={13} className="mx-auto mb-0.5" style={{ color }} />
                    <div className="text-xs font-bold" style={{ color }}>{value}</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function DonationCard({ donation }: { donation: any }) {
  const images: string[] = parseJSON(donation.imageUrls);
  const grade = gradeConfig[donation.qualityGrade] || gradeConfig.good;
  const status = statusConfig[donation.status] || statusConfig.pending;
  const RecipientIcon = recipientIcon[donation.recipientType] || Heart;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      {/* Top image strip */}
      <div className="flex gap-1 h-40 overflow-hidden">
        {images.slice(0, 5).map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="flex-1 object-cover"
            style={{ minWidth: 0, filter: "none" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ))}
        {images.length === 0 && (
          <img
            src={donation.imageUrl || "https://placehold.co/600x240/1a2332/4ade80?text=No+Image"}
            alt={donation.title}
            className="w-full h-40 object-cover"
          />
        )}
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-xs font-medium mb-0.5" style={{ color: "var(--color-text-muted)" }}>{donation.category}</div>
            <div className="font-bold text-base leading-tight" style={{ color: "var(--color-text-primary)" }}>{donation.title}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{donation.condition}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.color + "20", color: grade.color }}>
              {grade.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: status.color + "20", color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Donor + recipient row */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
              {donation.donorName?.charAt(0) ?? "U"}
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{donation.donorName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RecipientIcon size={12} style={{ color: "#22C55E" }} />
            <span className="text-xs capitalize" style={{ color: "#22C55E" }}>{donation.recipientType}</span>
          </div>
          {donation.isRecyclable && (
            <div className="flex items-center gap-1">
              <Recycle size={11} style={{ color: "#22C55E" }} />
              <span className="text-xs" style={{ color: "#22C55E" }}>Recyclable</span>
            </div>
          )}
        </div>

        {/* Donate reason */}
        {donation.donateReason && (
          <p className="text-xs mb-3 italic" style={{ color: "var(--color-text-muted)" }}>
            "{donation.donateReason}"
          </p>
        )}

        {/* AI Analysis expandable */}
        <AIAnalysisPanel donation={donation} />
      </div>
    </div>
  );
}

export default function P2PDonationsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["p2p-donations"],
    queryFn: async () => {
      const res = await fetch("/api/p2p/donations", { credentials: "include" });
      return res.json();
    },
  });

  const donations: any[] = ((data as any)?.donations || []).filter((d: any) =>
    !search ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.donorName?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: donations.length,
    recyclable: donations.filter((d) => d.isRecyclable).length,
    delivered: donations.filter((d) => d.status === "delivered").length,
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
            <Heart size={11} /> DONATED PRODUCTS
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Donated Items</h1>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Products donated by our community — with full AI analysis and recycling insights.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Donations", value: stats.total, color: "#22C55E", icon: Heart },
          { label: "Recyclable Items", value: stats.recyclable, color: "#3B82F6", icon: Recycle },
          { label: "Delivered", value: stats.delivered, color: "#F59E0B", icon: Building },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <Icon size={18} className="mb-2" style={{ color }} />
            <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Search donations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        {isLoading ? "Loading..." : `${donations.length} donated items`}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--color-bg-card)" }}>
              <div className="h-40" style={{ background: "var(--color-bg-elevated)" }} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded w-2/3" style={{ background: "var(--color-bg-elevated)" }} />
                <div className="h-3 rounded w-1/2" style={{ background: "var(--color-bg-elevated)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
          <Heart size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>No donations yet</p>
          <p className="text-sm">Donate items from the P2P Marketplace to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {donations.map((d: any) => <DonationCard key={d.id} donation={d} />)}
        </div>
      )}
    </div>
  );
}
