import { useState } from "react";
import { X, Wrench, Loader, CheckCircle, AlertCircle, IndianRupee, ChevronRight, Sparkles, Clock, Shield } from "lucide-react";
import { useToast } from "./toast";

interface Props {
  listing: any;
  aiConcerns: string[];
  onClose: () => void;
}

const flawCategories = [
  { id: "screen", label: "Screen / Display damage" },
  { id: "body", label: "Body / Casing cracks or dents" },
  { id: "battery", label: "Battery degraded / not holding charge" },
  { id: "buttons", label: "Buttons / ports not working" },
  { id: "cosmetic", label: "Scratches / scuffs (cosmetic)" },
  { id: "functional", label: "Functional issues (software / hardware)" },
  { id: "accessories", label: "Missing accessories / parts" },
  { id: "other", label: "Other issues" },
];

type RefurbResult = {
  isRefurbishable: boolean;
  estimatedCost: number;
  turnaroundDays: number;
  resaleValueAfter: number;
  roi: number;
  flawsAddressed: string[];
  process: string[];
  warranty: string;
  summary: string;
  recommendation: string;
};

export function RefurbishModal({ listing, aiConcerns, onClose }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [selectedFlaws, setSelectedFlaws] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [originalPrice, setOriginalPrice] = useState(listing.originalPrice ? String(listing.originalPrice) : "");
  const [result, setResult] = useState<RefurbResult | null>(null);

  const toggleFlaw = (id: string) => {
    setSelectedFlaws(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const runRefurbishAnalysis = async () => {
    if (selectedFlaws.length === 0 && !additionalDetails.trim()) {
      toast("Please select at least one flaw or describe the issue.", "error");
      return;
    }

    setStep("analyzing");

    try {
      const selectedLabels = selectedFlaws.map(id => flawCategories.find(f => f.id === id)?.label).filter(Boolean);

      const prompt = `You are a product refurbishment cost estimator. Analyze this product and estimate refurbishment cost.

Product: ${listing.title || "Unknown product"}
Category: ${listing.category || "general"}
Condition: ${listing.condition || listing.qualityGrade || "fair"}
AI Quality Score: ${listing.aiScore ?? "N/A"}/100
AI Verdict: ${listing.aiVerdict || "N/A"}
Original Price: ₹${originalPrice || "unknown"}

AI-detected concerns: ${aiConcerns.join(", ") || "none"}

User-reported flaws:
${selectedLabels.map(l => `- ${l}`).join("\n") || "None selected"}

Additional details: ${additionalDetails || "None"}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "isRefurbishable": true,
  "estimatedCost": 1500,
  "turnaroundDays": 5,
  "resaleValueAfter": 8000,
  "roi": 65,
  "flawsAddressed": ["Screen replaced", "Body polished", "Battery tested"],
  "process": ["Disassemble and inspect", "Replace damaged screen", "Polish body and casing", "Full functional test", "Quality certification"],
  "warranty": "3 months post-refurbishment warranty",
  "summary": "The device has minor cosmetic damage but is fully functional. Refurbishment is cost-effective.",
  "recommendation": "Refurbish — strong ROI"
}

Rules:
- estimatedCost in INR (realistic Indian market rates)
- resaleValueAfter should be realistic post-refurb resale price in INR
- roi = ((resaleValueAfter - estimatedCost) / estimatedCost * 100), rounded
- turnaroundDays between 3-14
- isRefurbishable = false only if damage is irreparable (e.g. motherboard fried, destroyed beyond repair)
- flawsAddressed: what the refurbishment will fix
- process: 4-6 step refurbishment process`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "openai/gpt-4o-mini",
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      const text: string = data.content || data.message || data.choices?.[0]?.message?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response");
      const parsed: RefurbResult = JSON.parse(jsonMatch[0]);
      setResult(parsed);
      setStep("result");
    } catch (err) {
      toast("Refurbishment analysis failed. Please try again.", "error");
      setStep("form");
    }
  };

  const inputStyle = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
              <Wrench size={18} style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>Refurbishment Estimate</h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {listing.title || "Your product"} · AI-powered cost analysis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── FORM STEP ── */}
          {step === "form" && (
            <div className="px-6 py-5 space-y-5">
              {/* AI concerns reminder */}
              {aiConcerns.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#EF4444" }}>AI-detected issues with your product</div>
                  <div className="space-y-1">
                    {aiConcerns.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <AlertCircle size={11} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flaw selection */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                  What's wrong with the product? <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {flawCategories.map((flaw) => {
                    const selected = selectedFlaws.includes(flaw.id);
                    return (
                      <button
                        key={flaw.id}
                        type="button"
                        onClick={() => toggleFlaw(flaw.id)}
                        className="text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: selected ? "rgba(59,130,246,0.12)" : "var(--color-bg-elevated)",
                          border: `1px solid ${selected ? "rgba(59,130,246,0.4)" : "var(--color-border)"}`,
                          color: selected ? "#3B82F6" : "var(--color-text-secondary)",
                        }}
                      >
                        {selected && <CheckCircle size={10} className="inline mr-1" style={{ color: "#3B82F6" }} />}
                        {flaw.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional details */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                  Describe the issues in detail
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Screen has a crack in the bottom-left corner, back panel has a dent near the camera, battery drains in 3 hours..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>

              {/* Original price */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                  Original purchase price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Helps estimate post-refurbishment resale value accurately.
                </p>
              </div>
            </div>
          )}

          {/* ── ANALYZING STEP ── */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                <Sparkles size={28} style={{ color: "#3B82F6" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Analyzing refurbishment potential...</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>AI is estimating repair costs & resale value</p>
              </div>
              <Loader size={20} className="animate-spin" style={{ color: "#3B82F6" }} />
            </div>
          )}

          {/* ── RESULT STEP ── */}
          {step === "result" && result && (
            <div className="px-6 py-5 space-y-5">
              {/* Verdict banner */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: result.isRefurbishable ? "rgba(59,130,246,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${result.isRefurbishable ? "rgba(59,130,246,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.isRefurbishable
                    ? <Wrench size={16} style={{ color: "#3B82F6" }} />
                    : <AlertCircle size={16} style={{ color: "#EF4444" }} />
                  }
                  <span className="font-bold text-sm" style={{ color: result.isRefurbishable ? "#3B82F6" : "#EF4444" }}>
                    {result.isRefurbishable ? "Refurbishable — Good Candidate" : "Not Worth Refurbishing"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{result.summary}</p>
              </div>

              {result.isRefurbishable && (
                <>
                  {/* Cost + Value cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                      <IndianRupee size={14} className="mx-auto mb-1" style={{ color: "#EF4444" }} />
                      <div className="text-base font-black" style={{ color: "#EF4444" }}>₹{result.estimatedCost.toLocaleString()}</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Refurb Cost</div>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                      <IndianRupee size={14} className="mx-auto mb-1" style={{ color: "#22C55E" }} />
                      <div className="text-base font-black" style={{ color: "#22C55E" }}>₹{result.resaleValueAfter.toLocaleString()}</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Est. Resale Value</div>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                      <Clock size={14} className="mx-auto mb-1" style={{ color: "#F59E0B" }} />
                      <div className="text-base font-black" style={{ color: "#F59E0B" }}>{result.turnaroundDays}d</div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Turnaround</div>
                    </div>
                  </div>

                  {/* ROI bar */}
                  <div className="p-4 rounded-xl" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Return on Investment</span>
                      <span className="text-sm font-black" style={{ color: result.roi > 50 ? "#22C55E" : result.roi > 20 ? "#F59E0B" : "#EF4444" }}>
                        +{result.roi}% ROI
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--color-border)" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(result.roi, 100)}%`,
                          background: result.roi > 50 ? "#22C55E" : result.roi > 20 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>{result.recommendation}</p>
                  </div>

                  {/* What gets fixed */}
                  {result.flawsAddressed.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>What the refurbishment covers</div>
                      <div className="space-y-1.5">
                        {result.flawsAddressed.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <CheckCircle size={11} style={{ color: "#22C55E", flexShrink: 0 }} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Process steps */}
                  {result.process.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Refurbishment process</div>
                      <div className="space-y-2">
                        {result.process.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                              style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}
                            >
                              {i + 1}
                            </div>
                            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warranty */}
                  {result.warranty && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <Shield size={13} style={{ color: "#22C55E" }} />
                      <span className="text-xs" style={{ color: "#22C55E" }}>{result.warranty}</span>
                    </div>
                  )}
                </>
              )}

              {/* Re-analyze */}
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                <ChevronRight size={12} style={{ transform: "rotate(180deg)" }} /> Re-analyze with different details
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex gap-3" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-sm font-semibold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
          >
            Close
          </button>
          {step === "form" && (
            <button
              onClick={runRefurbishAnalysis}
              className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#3B82F6", color: "#fff" }}
            >
              <Sparkles size={14} /> Estimate Refurb Cost
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
