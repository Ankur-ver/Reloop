import { X, Recycle, Leaf, Zap, Droplets, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Props {
  listing: any;
  onClose: () => void;
}

function parseJSON(str: string | null | undefined, fallback: any = null) {
  if (!str) return fallback;
  try { return typeof str === "string" ? JSON.parse(str) : str; } catch { return fallback; }
}

export function RecycleModal({ listing, onClose }: Props) {
  const recycleData = parseJSON(listing.recycleData);

  if (!recycleData) {
    return (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "#F59E0B" }} />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No recycle data available for this listing.</p>
          <button onClick={onClose} className="mt-4 px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}>Close</button>
        </div>
      </div>
    );
  }

  const materials: any[] = recycleData.materials || [];
  const parts: any[] = recycleData.parts || [];
  const impact = recycleData.environmentalImpact || {};
  const instructions: string[] = recycleData.instructions || [];
  const centres: string[] = recycleData.certifiedCentres || [];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
              <Recycle size={18} style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>Recycle Analysis</h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{listing.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Recyclability verdict */}
          <div
            className="p-4 rounded-xl flex items-start gap-3"
            style={{
              background: listing.isRecyclable ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${listing.isRecyclable ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            {listing.isRecyclable
              ? <CheckCircle size={20} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
              : <XCircle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
            }
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: listing.isRecyclable ? "#22C55E" : "#EF4444" }}>
                {listing.isRecyclable ? "Recyclable Product" : "Not Easily Recyclable"}
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                  Recycle Score: {recycleData.recycleScore ?? "—"}/100
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{recycleData.recyclingReason}</p>
            </div>
          </div>

          {/* Material composition */}
          {materials.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Material Composition</h3>
              {/* Stacked bar */}
              <div className="flex h-6 rounded-full overflow-hidden mb-3 gap-0.5">
                {materials.map((m, i) => (
                  <div
                    key={i}
                    style={{ width: `${m.percentage}%`, background: m.color || "#3B82F6", minWidth: 2 }}
                    title={`${m.name}: ${m.percentage}%`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {materials.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: m.color || "#3B82F6" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{m.name}</span>
                        <span className="text-xs font-bold" style={{ color: m.color || "#3B82F6" }}>{m.percentage}%</span>
                      </div>
                      <span
                        className="text-[10px]"
                        style={{ color: m.recyclable ? "#22C55E" : "#EF4444" }}
                      >
                        {m.recyclable ? "✓ Recyclable" : "✗ Non-recyclable"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parts breakdown */}
          {parts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Parts Breakdown</h3>
              <div className="space-y-2">
                {parts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-start gap-2">
                      {p.recyclable
                        ? <CheckCircle size={13} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
                        : <XCircle size={13} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                      }
                      <div>
                        <div className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{p.name}</div>
                        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{p.material}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-right shrink-0 max-w-[140px]" style={{ color: "var(--color-text-muted)" }}>{p.disposalMethod}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environmental impact */}
          {(impact.co2SavedKg || impact.waterSavedL || impact.energySavedKwh) ? (
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Environmental Impact of Recycling</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Leaf, label: "CO₂ Saved", value: `${impact.co2SavedKg} kg`, color: "#22C55E" },
                  { icon: Droplets, label: "Water Saved", value: `${impact.waterSavedL} L`, color: "#3B82F6" },
                  { icon: Zap, label: "Energy Saved", value: `${impact.energySavedKwh} kWh`, color: "#F59E0B" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                    <Icon size={18} className="mx-auto mb-1" style={{ color }} />
                    <div className="text-sm font-bold" style={{ color }}>{value}</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>How to Recycle</h3>
              <div className="space-y-2">
                {instructions.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certified centres */}
          {centres.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "#22C55E" }}>Where to Recycle</div>
              <div className="flex flex-wrap gap-2">
                {centres.map((c, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm font-semibold"
            style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
