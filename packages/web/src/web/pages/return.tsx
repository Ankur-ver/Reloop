import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Upload, Zap, CheckCircle, Coins, ShoppingBag, Heart, Recycle,
  ArrowLeftRight, RefreshCcw, ChevronRight, AlertCircle, Loader,
  Package, Clock, MapPin, Truck, Star, CheckCircle2, Circle,
  ExternalLink, ArrowRight, Calendar, Shield
} from "lucide-react";

const returnReasons = [
  "Wrong size / doesn't fit",
  "Changed my mind",
  "Defective / not working",
  "Damaged on arrival",
  "Minor scratches / cosmetic wear",
  "Received as gift but don't need",
  "Duplicate purchase",
  "Too expensive / over budget",
  "Product not as described",
  "Other",
];

const dispositionInfo: Record<string, { label: string; color: string; bg: string; icon: any; action: string }> = {
  resell: { label: "Certified Resell", color: "#22C55E", bg: "rgba(34,197,94,0.12)", icon: ShoppingBag, action: "Your item will be listed on ReLoop Certified Marketplace" },
  refurbish: { label: "Refurbishment", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: Zap, action: "Item sent to certified refurbishment center" },
  donate: { label: "Donation", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Heart, action: "Item matched with NGO partner for social impact" },
  recycle: { label: "Recycling", color: "#6B7280", bg: "rgba(107,114,128,0.12)", icon: Recycle, action: "Item sent to certified e-waste recycling facility" },
  exchange: { label: "Exchange", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: ArrowLeftRight, action: "Swap for another product of equal/lesser value" },
};

const gradeColors: Record<string, string> = {
  excellent: "#22C55E", good: "#3B82F6", fair: "#F59E0B", poor: "#EF4444"
};

const trackingStatusConfig: Record<string, { label: string; color: string }> = {
  initiated: { label: "Return Initiated", color: "#8B5CF6" },
  pickup_scheduled: { label: "Pickup Scheduled", color: "#3B82F6" },
  picked_up: { label: "Picked Up", color: "#F59E0B" },
  in_transit: { label: "In Transit", color: "#F59E0B" },
  processed: { label: "Quality Graded", color: "#22C55E" },
  listed: { label: "Listed on Marketplace", color: "#22C55E" },
  donated: { label: "Donated", color: "#F59E0B" },
  recycled: { label: "Recycled", color: "#6B7280" },
};

function TrackingTimeline({ timeline, returnStatus }: { timeline: any[]; returnStatus: string }) {
  return (
    <div className="space-y-0">
      {timeline.map((step, i) => {
        const isLast = i === timeline.length - 1;
        const isCurrent = !step.done && timeline[i - 1]?.done;
        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{
                  background: step.done ? "rgba(34,197,94,0.15)" : isCurrent ? "rgba(59,130,246,0.15)" : "var(--color-bg-elevated)",
                  border: step.done ? "2px solid #22C55E" : isCurrent ? "2px solid #3B82F6" : "2px solid var(--color-border)",
                }}
              >
                {step.done ? (
                  <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3B82F6" }} />
                ) : (
                  <Circle size={10} style={{ color: "var(--color-border)" }} />
                )}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 my-1" style={{ background: step.done ? "rgba(34,197,94,0.3)" : "var(--color-border)", minHeight: 24 }} />
              )}
            </div>
            {/* Content */}
            <div className={`pb-5 ${isLast ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold" style={{ color: step.done ? "var(--color-text-primary)" : isCurrent ? "#3B82F6" : "var(--color-text-muted)" }}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                    In Progress
                  </span>
                )}
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{step.description}</div>
              {step.completedAt && step.done && (
                <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)", opacity: 0.7 }}>
                  {new Date(step.completedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReturnPage() {
  const [step, setStep] = useState<"select-order" | "form" | "result">("select-order");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  // Fetch user orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => (await (api as any).orders.$get()).json(),
  });

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setUploadedFiles((prev) => {
      const updated = [...prev, ...newFiles].slice(0, 5);
      if (updated.length > 0) setPhotoError(null);
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const submitReturn = useMutation({
    mutationFn: async () => {
      const res = await api.returns.submit.$post({
        json: {
          orderId: selectedOrder?.id,
          productName: selectedOrder?.productName,
          category: selectedOrder?.category,
          brand: selectedOrder?.brand,
          purchaseDate: selectedOrder ? new Date(selectedOrder.purchasedAt).toISOString().split("T")[0] : "",
          returnReason,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason) return;
    if (uploadedFiles.length === 0) {
      setPhotoError("At least 1 product photo is required.");
      return;
    }
    setPhotoError(null);
    submitReturn.mutate();
  };

  const handleReset = () => {
    setStep("select-order");
    setResult(null);
    setSelectedOrder(null);
    setUploadedFiles([]);
    setPhotoError(null);
    setReturnReason("");
  };

  // ── RESULT / TRACKING SCREEN ────────────────────────────────────────
  if (step === "result" && result) {
    const { submission, aiResult, timeline, listedProduct } = result;
    const dispositionDef = dispositionInfo[aiResult.disposition] || dispositionInfo.resell;
    const Icon = dispositionDef.icon;
    const trackingCfg = trackingStatusConfig[submission.returnStatus] || trackingStatusConfig.initiated;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(34,197,94,0.15)" }}>
            <CheckCircle size={32} style={{ color: "var(--color-accent-green)" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Return Initiated!</h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            AI has assessed your product and the return is now in progress.
          </p>
        </div>

        {/* Product + Order Info */}
        <div className="p-5 rounded-2xl mb-4 flex items-center gap-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          {selectedOrder?.imageUrl && (
            <img src={selectedOrder.imageUrl} alt={submission.productName} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{submission.productName}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{submission.brand} · {submission.category}</div>
            {selectedOrder?.orderRef && (
              <div className="text-xs mt-1 font-mono" style={{ color: "var(--color-text-muted)" }}>Order {selectedOrder.orderRef}</div>
            )}
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${trackingCfg.color}20`, color: trackingCfg.color }}>
            {trackingCfg.label}
          </div>
        </div>

        {/* AI Result */}
        <div className="p-6 rounded-2xl mb-4" style={{ background: dispositionDef.bg, border: `1px solid ${dispositionDef.color}40` }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${dispositionDef.color}20` }}>
              <Icon size={22} style={{ color: dispositionDef.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg" style={{ color: dispositionDef.color }}>{dispositionDef.label}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${dispositionDef.color}20`, color: dispositionDef.color }}>
                  {aiResult.confidenceScore}% confident
                </span>
              </div>
              <div className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>{dispositionDef.action}</div>
              <div className="text-sm p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-text-primary)" }}>AI Reasoning: </strong>{aiResult.aiReasoning}
              </div>
            </div>
          </div>
        </div>

        {/* Quality + Credits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Quality Grade</div>
            <div className="text-2xl font-bold capitalize" style={{ color: gradeColors[aiResult.qualityGrade], fontFamily: "JetBrains Mono" }}>
              {aiResult.qualityGrade}
            </div>
            <div className="mt-2 h-2 rounded-full" style={{ background: "var(--color-border)" }}>
              <div className="h-2 rounded-full" style={{ width: `${aiResult.qualityScore}%`, background: gradeColors[aiResult.qualityGrade] }} />
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{aiResult.qualityScore}/100</div>
          </div>
          <div className="p-5 rounded-2xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#F59E0B" }}>Green Credits Earned</div>
            <div className="flex items-center gap-2">
              <Coins size={24} style={{ color: "#F59E0B" }} />
              <div className="text-2xl font-bold" style={{ color: "#F59E0B", fontFamily: "JetBrains Mono" }}>+{aiResult.greenCreditsAwarded}</div>
            </div>
            <div className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Added to your wallet instantly</div>
          </div>
        </div>

        {/* Marketplace listing alert */}
        {listedProduct && (
          <div className="p-4 rounded-2xl mb-4 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <ShoppingBag size={18} style={{ color: "var(--color-accent-green)", flexShrink: 0 }} />
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Now live on ReLoop Marketplace</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Listed at ₹{listedProduct.reloopPrice?.toLocaleString("en-IN")} · Certified quality grade
              </div>
            </div>
            <a href="/marketplace">
              <ExternalLink size={15} style={{ color: "var(--color-accent-green)" }} />
            </a>
          </div>
        )}

        {/* Return Tracking */}
        <div className="p-6 rounded-2xl mb-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Truck size={16} style={{ color: "var(--color-accent-green)" }} />
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Return Tracking</span>
          </div>
          <TrackingTimeline timeline={timeline} returnStatus={submission.returnStatus} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex-1 py-3 rounded-full font-semibold text-sm transition-all"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}>
            Return Another
          </button>
          <a href="/credits" className="flex-1">
            <button className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
              View Credits <Coins size={15} />
            </button>
          </a>
        </div>
      </div>
    );
  }

  // ── ORDER SELECTION SCREEN ──────────────────────────────────────────
  if (step === "select-order") {
    const orders = ordersData?.orders || [];
    const returnable = orders.filter((o: any) => o.isReturnable);
    const expired = orders.filter((o: any) => !o.isReturnable);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>
            <Package size={11} /> SELECT ORDER TO RETURN
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Which order?</h1>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Pick an order within its return window. AI will handle the rest.
          </p>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--color-bg-card)" }} />
            ))}
          </div>
        ) : (
          <>
            {/* Returnable orders */}
            {returnable.length > 0 && (
              <div className="space-y-3 mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Eligible for Return ({returnable.length})
                </div>
                {returnable.map((order: any) => (
                  <button
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setStep("form"); }}
                    className="w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] group"
                    style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                  >
                    <img
                      src={order.imageUrl}
                      alt={order.productName}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{order.productName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{order.brand} · {order.orderRef}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                          <Clock size={11} />
                          <span className="font-semibold">{order.daysLeft}d left</span>
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          ₹{order.price.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                        Returnable
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Expired window orders */}
            {expired.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Return Window Expired
                </div>
                {expired.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl flex items-center gap-4 opacity-50"
                    style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                  >
                    <img
                      src={order.imageUrl}
                      alt={order.productName}
                      className="w-14 h-14 object-cover rounded-xl flex-shrink-0 grayscale"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{order.productName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{order.brand} · {order.orderRef}</div>
                      <div className="text-xs mt-1" style={{ color: "#EF4444" }}>
                        Return window expired ({order.returnWindowDays} days)
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                      Expired
                    </div>
                  </div>
                ))}
              </div>
            )}

            {orders.length === 0 && (
              <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
                <Package size={40} className="mx-auto mb-4 opacity-30" />
                <p>No orders found. Orders will appear here once delivered.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── RETURN FORM ─────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => setStep("select-order")}
          className="flex items-center gap-1 text-sm mb-5 transition-opacity hover:opacity-70"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Back to orders
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>
          <Zap size={11} /> AI-POWERED DISPOSITION ENGINE
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Submit Return</h1>
      </div>

      {/* Selected order preview */}
      {selectedOrder && (
        <div className="p-4 rounded-2xl mb-6 flex items-center gap-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <img src={selectedOrder.imageUrl} alt={selectedOrder.productName} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{selectedOrder.productName}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{selectedOrder.brand} · {selectedOrder.orderRef}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={11} style={{ color: "#22C55E" }} />
              <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>{selectedOrder.daysLeft} days left to return</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
            <Shield size={11} /> {selectedOrder.returnWindowDays}d window
          </div>
        </div>
      )}

      {/* Disposition pills */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {Object.entries(dispositionInfo).map(([key, { label, color, icon: Icon }]) => (
          <div key={key} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
            <Icon size={11} /> {label}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-6 rounded-2xl space-y-5" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Reason for Return <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            >
              <option value="">Select reason</option>
              {returnReasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Product Photos <span style={{ color: "#EF4444" }}>*</span>
              <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>Required for AI quality grading</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
            <div
              className="flex items-center justify-center p-8 rounded-xl border-dashed border-2 cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? "var(--color-accent-green)" : photoError ? "#EF4444" : "var(--color-border)",
                background: isDragging ? "rgba(34,197,94,0.06)" : photoError ? "rgba(239,68,68,0.04)" : "var(--color-bg-elevated)",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload size={24} className="mx-auto mb-2" style={{ color: isDragging ? "var(--color-accent-green)" : "var(--color-text-muted)" }} />
                <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Drag & drop or click to upload</div>
                <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>AI analyzes condition for quality grading</div>
              </div>
            </div>
            {photoError && (
              <div className="flex items-center gap-2 mt-2 text-xs font-medium" style={{ color: "#EF4444" }}>
                <AlertCircle size={13} /> {photoError}
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg border"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#EF4444", color: "#fff" }}
                    >×</button>
                  </div>
                ))}
                <div className="text-xs self-center" style={{ color: "var(--color-text-muted)" }}>
                  {uploadedFiles.length}/5 photo{uploadedFiles.length > 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI hint */}
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <AlertCircle size={16} style={{ color: "var(--color-accent-green)", flexShrink: 0, marginTop: 2 }} />
          <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            AI will determine disposition, quality grade, and Green Credits. Your item will go directly to the marketplace if eligible for resell.
          </div>
        </div>

        <button
          type="submit"
          disabled={submitReturn.isPending}
          className="w-full py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
        >
          {submitReturn.isPending ? (
            <><Loader size={18} className="animate-spin" /> AI is analyzing your product...</>
          ) : (
            <><Zap size={18} /> Analyze & Submit Return <ChevronRight size={16} /></>
          )}
        </button>

        {submitReturn.isError && (
          <div className="flex items-center gap-2 text-sm text-center justify-center" style={{ color: "#EF4444" }}>
            <AlertCircle size={15} />
            {(submitReturn.error as any)?.message || "Failed to submit return. Please try again."}
          </div>
        )}
      </form>
    </div>
  );
}
