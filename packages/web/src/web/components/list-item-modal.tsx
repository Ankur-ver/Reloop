import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  X, Loader, Plus, Camera, CheckCircle, AlertCircle,
  RotateCcw, ScanLine, Layers, ArrowLeft, ArrowRight, Trash2,
  Sparkles, ShieldCheck, ShieldX, CircleDot, Recycle, Heart, Wrench,
} from "lucide-react";
import { useToast } from "./toast";
import { authClient } from "../lib/auth";
import { useLocation } from "wouter";
import { DonateModal } from "./donate-modal";
import { RecycleModal } from "./recycle-modal";
import { RefurbishModal } from "./refurbish-modal";
import { getToken } from "../lib/auth";
const API_URL = import.meta.env.VITE_API_URL;

const categories = ["electronics", "clothing", "footwear", "furniture", "appliances", "books", "toys", "sports", "other"];
const conditions = ["Like New", "Excellent", "Good", "Fair"];

const gradeMap: Record<string, string> = {
  "Like New": "excellent",
  "Excellent": "excellent",
  "Good": "good",
  "Fair": "fair",
};

const gradeColor: Record<string, string> = {
  excellent: "#22C55E",
  good: "#3B82F6",
  fair: "#F59E0B",
  poor: "#EF4444",
};

// Required photo angles
const REQUIRED_ANGLES = [
  { id: "front", label: "Front View", icon: ScanLine, hint: "Main face of the product" },
  { id: "back", label: "Back View", icon: RotateCcw, hint: "Rear side clearly visible" },
  { id: "left", label: "Left Side", icon: ArrowLeft, hint: "Left profile of the item" },
  { id: "right", label: "Right Side", icon: ArrowRight, hint: "Right profile of the item" },
  { id: "detail", label: "Close-up / Detail", icon: Layers, hint: "Defects, ports, labels, etc." },
];

type PhotoSlot = {
  id: string;
  label: string;
  icon: any;
  hint: string;
  file?: File;
  preview?: string;
  uploading?: boolean;
  uploadedUrl?: string;
  error?: string;
};

type AIResult = {
  sellable: boolean;
  qualityGrade: string;
  qualityScore: number;
  verdict: string;
  positives: string[];
  concerns: string[];
  aiReasoning: string;
  isRecyclable: boolean;
  recycleData: any;
};

interface Props {
  onClose: () => void;
}

export function ListItemModal({ onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "",
    price: "",
    originalPrice: "",
    location: "India",
    description: "",
  });

  const [photos, setPhotos] = useState<PhotoSlot[]>(
    REQUIRED_ANGLES.map((a) => ({ ...a }))
  );
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [recycleModal, setRecycleModal] = useState(false);
  const [refurbishModal, setRefurbishModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temporary listing-like object for donate/recycle modals
  const tempListing = {
    id: 0,
    title: form.title,
    category: form.category,
    condition: form.condition,
    imageUrl: photos[0]?.uploadedUrl || "",
    imageUrls: JSON.stringify(photos.map(p => p.uploadedUrl).filter(Boolean)),
    location: form.location,
    description: form.description,
    aiScore: aiResult?.qualityScore,
    qualityGrade: aiResult?.qualityGrade || "good",
    aiVerdict: aiResult?.verdict,
    aiReasoning: aiResult?.aiReasoning,
    aiPositives: JSON.stringify(aiResult?.positives || []),
    aiConcerns: JSON.stringify(aiResult?.concerns || []),
    isRecyclable: aiResult?.isRecyclable || false,
    recycleData: aiResult?.recycleData ? JSON.stringify(aiResult.recycleData) : null,
  };

  // Upload a single file to S3 via presigned URL
  const uploadFile = useCallback(async (file: File, slotId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === slotId ? { ...p, uploading: true, error: undefined } : p))
    );
    try {
      const res = await fetch(`${API_URL}/api/upload/presign`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const preview = URL.createObjectURL(file);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === slotId
            ? { ...p, file, preview, uploading: false, uploadedUrl: publicUrl }
            : p
        )
      );
      // Reset AI result whenever a photo changes — need re-analysis
      setAiResult(null);
    } catch (err: any) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === slotId ? { ...p, uploading: false, error: "Upload failed. Tap to retry." } : p
        )
      );
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlot) return;
    e.target.value = "";
    uploadFile(file, activeSlot);
  };

  const triggerUpload = (slotId: string) => {
    setActiveSlot(slotId);
    fileInputRef.current?.click();
  };

  const removePhoto = (slotId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === slotId ? { ...p, file: undefined, preview: undefined, uploadedUrl: undefined, error: undefined } : p
      )
    );
    setAiResult(null);
  };

  const uploadedCount = photos.filter((p) => p.uploadedUrl).length;
  const allUploaded = uploadedCount === REQUIRED_ANGLES.length;

  // Run AI analysis on all 5 photos
  const runAIAnalysis = async () => {
    if (!allUploaded) return;
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const imageUrls = photos.map((p) => p.uploadedUrl!);
      const res = await fetch(`${API_URL}/api/p2p/analyze`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          imageUrls,
          category: form.category,
          title: form.title,
          condition: form.condition,
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const result: AIResult = await res.json();
      setAiResult(result);
    } catch (err) {
      toast("AI analysis failed. Please try again.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createListing = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.p2p.listings.$post({ json: data });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || "Failed to create listing");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      toast("Listing published! Your item is now live on P2P marketplace.", "success");
      onClose();
    },
    onError: (err: any) => {
      toast(err.message || "Failed to create listing", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!allUploaded) {
      toast(`Please upload all ${REQUIRED_ANGLES.length} required photos before publishing.`, "error");
      return;
    }
    if (!aiResult) {
      toast("Run AI analysis first to verify your product.", "error");
      return;
    }
    if (!aiResult.sellable) {
      toast("Product did not pass AI quality check. Address the concerns and re-analyze.", "error");
      return;
    }
    if (!session) {
      navigate("/sign-in");
      onClose();
      return;
    }

    const price = parseFloat(form.price);
    const originalPrice = parseFloat(form.originalPrice) || price * 1.5;
    const imageUrls = photos.map((p) => p.uploadedUrl!);

    createListing.mutate({
      title: form.title,
      category: form.category,
      condition: form.condition,
      qualityGrade: aiResult.qualityGrade || gradeMap[form.condition] || "good",
      price,
      originalPrice,
      location: form.location,
      description: form.description,
      imageUrl: imageUrls[0],
      imageUrls,
      status: "active",
      aiScore: aiResult.qualityScore,
      aiVerdict: aiResult.verdict,
      aiReasoning: aiResult.aiReasoning,
      aiPositives: aiResult.positives,
      aiConcerns: aiResult.concerns,
      isRecyclable: aiResult.isRecyclable,
      recycleData: aiResult.recycleData,
    });
  };

  const inputStyle = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  const canPublish = allUploaded && aiResult?.sellable;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {donateModal && <DonateModal listing={tempListing} onClose={() => setDonateModal(false)} />}
      {recycleModal && <RecycleModal listing={tempListing} onClose={() => setRecycleModal(false)} />}
      {refurbishModal && <RefurbishModal listing={tempListing} aiConcerns={aiResult?.concerns || []} onClose={() => setRefurbishModal(false)} />}
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>List an Item</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Sell your unused items to verified buyers
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Photo Upload Section ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Product Photos <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: allUploaded ? "rgba(34,197,94,0.12)" : submitAttempted && !allUploaded ? "rgba(239,68,68,0.12)" : "rgba(234,179,8,0.12)",
                  color: allUploaded ? "#22C55E" : submitAttempted && !allUploaded ? "#EF4444" : "#EAB308",
                }}
              >
                {uploadedCount} / {REQUIRED_ANGLES.length} uploaded
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
              Upload 5 photos from different angles. AI will analyze them to verify your product's condition.
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Photo slots grid */}
            <div className="grid grid-cols-5 gap-2">
              {photos.map((slot) => {
                const Icon = slot.icon;
                const isDone = !!slot.uploadedUrl;
                const isError = !!slot.error;
                const isLoading = !!slot.uploading;
                const isMissing = submitAttempted && !isDone && !isLoading;

                return (
                  <div key={slot.id} className="flex flex-col gap-1">
                    <div
                      onClick={() => !isLoading && triggerUpload(slot.id)}
                      className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                      style={{
                        aspectRatio: "1",
                        border: isDone
                          ? "2px solid #22C55E"
                          : isMissing || isError
                            ? "2px solid #EF4444"
                            : "2px dashed var(--color-border)",
                        background: isDone ? "transparent" : "var(--color-bg-elevated)",
                      }}
                    >
                      {/* Preview image */}
                      {slot.preview && (
                        <img
                          src={slot.preview}
                          alt={slot.label}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}

                      {/* Overlay states */}
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                          <Loader size={18} className="animate-spin" style={{ color: "#fff" }} />
                        </div>
                      ) : isDone ? (
                        <>
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                            <CheckCircle size={12} color="#fff" fill="#22C55E" />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removePhoto(slot.id); }}
                            className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(0,0,0,0.6)" }}
                          >
                            <Trash2 size={10} color="#fff" />
                          </button>
                        </>
                      ) : isError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1">
                          <AlertCircle size={16} style={{ color: "#EF4444" }} />
                          <span className="text-[9px] text-center leading-tight" style={{ color: "#EF4444" }}>Tap to retry</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <Icon size={16} style={{ color: isMissing ? "#EF4444" : "var(--color-text-muted)" }} />
                          <Camera size={11} style={{ color: isMissing ? "#EF4444" : "var(--color-text-muted)" }} />
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[10px] text-center leading-tight font-medium"
                      style={{ color: isDone ? "#22C55E" : isMissing ? "#EF4444" : "var(--color-text-muted)" }}
                    >
                      {slot.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Angle hints */}
            <div className="mt-3 p-3 rounded-xl space-y-1" style={{ background: "var(--color-bg-elevated)" }}>
              {photos.map((slot) => {
                const Icon = slot.icon;
                return (
                  <div key={slot.id} className="flex items-center gap-2 text-xs">
                    <Icon size={11} style={{ color: slot.uploadedUrl ? "#22C55E" : "var(--color-text-muted)", flexShrink: 0 }} />
                    <span style={{ color: slot.uploadedUrl ? "#22C55E" : "var(--color-text-muted)" }}>
                      <span className="font-semibold">{slot.label}:</span> {slot.hint}
                    </span>
                    {slot.uploadedUrl && <CheckCircle size={10} style={{ color: "#22C55E", marginLeft: "auto" }} />}
                  </div>
                );
              })}
            </div>

            {submitAttempted && !allUploaded && (
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "#EF4444" }}>
                <AlertCircle size={12} />
                All 5 photos are required before publishing.
              </div>
            )}

            {/* ── AI Analysis CTA ── */}
            {allUploaded && !aiResult && (
              <button
                onClick={runAIAnalysis}
                disabled={isAnalyzing}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: isAnalyzing ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  color: "#8B5CF6",
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader size={15} className="animate-spin" />
                    AI is analyzing your photos...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Run AI Quality Check
                  </>
                )}
              </button>
            )}

            {/* ── AI Analysis Result ── */}
            {aiResult && (
              <div
                className="mt-4 rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${aiResult.sellable ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                  background: aiResult.sellable ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                }}
              >
                {/* Result header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: aiResult.sellable ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    borderBottom: `1px solid ${aiResult.sellable ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {aiResult.sellable ? (
                      <ShieldCheck size={18} style={{ color: "#22C55E" }} />
                    ) : (
                      <ShieldX size={18} style={{ color: "#EF4444" }} />
                    )}
                    <span className="text-sm font-bold" style={{ color: aiResult.sellable ? "#22C55E" : "#EF4444" }}>
                      {aiResult.sellable ? "AI Approved — Ready to Sell" : "AI Rejected — Not Sellable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: (gradeColor[aiResult.qualityGrade] || "#22C55E") + "20",
                        color: gradeColor[aiResult.qualityGrade] || "#22C55E",
                      }}
                    >
                      {aiResult.qualityGrade.charAt(0).toUpperCase() + aiResult.qualityGrade.slice(1)}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                      {aiResult.qualityScore}/100
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="px-4 pt-3">
                  <div className="h-1.5 rounded-full w-full" style={{ background: "var(--color-bg-elevated)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${aiResult.qualityScore}%`,
                        background: aiResult.sellable
                          ? `linear-gradient(90deg, #22C55E, ${gradeColor[aiResult.qualityGrade] || "#22C55E"})`
                          : "linear-gradient(90deg, #EF4444, #F97316)",
                      }}
                    />
                  </div>
                </div>

                <div className="px-4 py-3 space-y-3">
                  {/* Verdict */}
                  <p className="text-xs italic" style={{ color: "var(--color-text-secondary)" }}>
                    "{aiResult.verdict}"
                  </p>

                  {/* Positives */}
                  {aiResult.positives.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold mb-1" style={{ color: "#22C55E" }}>What looks good</div>
                      <div className="space-y-0.5">
                        {aiResult.positives.map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <CheckCircle size={11} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concerns */}
                  {aiResult.concerns.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold mb-1" style={{ color: aiResult.sellable ? "#F59E0B" : "#EF4444" }}>
                        {aiResult.sellable ? "Minor concerns" : "Issues found"}
                      </div>
                      <div className="space-y-0.5">
                        {aiResult.concerns.map((c, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <CircleDot size={11} style={{ color: aiResult.sellable ? "#F59E0B" : "#EF4444", flexShrink: 0, marginTop: 1 }} />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI reasoning */}
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <span className="font-semibold" style={{ color: "#8B5CF6" }}>AI: </span>
                    {aiResult.aiReasoning}
                  </p>

                  {/* Recyclability + Donate/Recycle actions */}
                  <div className="pt-2 border-t space-y-2" style={{ borderColor: aiResult.sellable ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}>
                    {/* Recycle button or Not Recyclable badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {aiResult.isRecyclable ? (
                        <button
                          type="button"
                          onClick={() => setRecycleModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                          style={{
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.35)",
                            color: "#22C55E",
                            cursor: "pointer",
                          }}
                        >
                          <Recycle size={12} />
                          Recyclable — View Details
                        </button>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            background: "rgba(107,114,128,0.12)",
                            border: "1px solid rgba(107,114,128,0.2)",
                            color: "#6B7280",
                          }}
                        >
                          <Recycle size={12} />
                          Not Easily Recyclable
                        </div>
                      )}
                      {aiResult.recycleData && (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          Recycle score: {aiResult.recycleData.recycleScore}/100
                        </span>
                      )}
                    </div>

                    {/* Donate / Recycle action buttons — always shown after AI analysis */}
                    <div className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      {aiResult.sellable ? "Instead of selling, you can also:" : "You can still give it a second life:"}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDonateModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.3)",
                          color: "#22C55E",
                        }}
                      >
                        <Heart size={12} /> Donate
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefurbishModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: "rgba(59,130,246,0.12)",
                          border: "1px solid rgba(59,130,246,0.3)",
                          color: "#3B82F6",
                        }}
                      >
                        <Wrench size={12} /> Refurbish
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecycleModal(true)}
                        disabled={!aiResult.isRecyclable}
                        title={!aiResult.isRecyclable ? "AI found this item is not easily recyclable" : "Recycle this item responsibly"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: aiResult.isRecyclable ? "rgba(59,130,246,0.12)" : "var(--color-bg-elevated)",
                          border: `1px solid ${aiResult.isRecyclable ? "rgba(59,130,246,0.3)" : "var(--color-border)"}`,
                          color: aiResult.isRecyclable ? "#3B82F6" : "var(--color-text-muted)",
                        }}
                      >
                        <Recycle size={12} />
                        {aiResult.isRecyclable ? "Recycle" : "Not Recyclable"}
                      </button>
                    </div>
                    {!aiResult.isRecyclable && (
                      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        AI determined this item cannot be easily recycled. Donate instead to give it a second life.
                      </p>
                    )}
                  </div>

                  {/* Re-analyze button if rejected */}
                  {!aiResult.sellable && (
                    <button
                      onClick={runAIAnalysis}
                      disabled={isAnalyzing}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#8B5CF6" }}
                    >
                      <RotateCcw size={12} /> Re-analyze after fixing photos
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Product Details ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Product Details</h3>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Item Title <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Apple AirPods Pro 2nd Gen"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  Category <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  Condition <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  required
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  Your Price (₹) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 12000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Delhi, Bangalore"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Description</label>
              <textarea
                rows={3}
                placeholder="Describe the item's condition, accessories included, reason for selling..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex gap-3" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-sm font-semibold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createListing.isPending || photos.some((p) => p.uploading) || isAnalyzing || !canPublish}
            className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canPublish ? "var(--color-accent-green)" : "var(--color-bg-elevated)",
              color: canPublish ? "#0A0F1E" : "var(--color-text-muted)",
              border: canPublish ? "none" : "1px solid var(--color-border)",
            }}
          >
            {createListing.isPending ? (
              <><Loader size={15} className="animate-spin" /> Publishing...</>
            ) : photos.some((p) => p.uploading) ? (
              <><Loader size={15} className="animate-spin" /> Uploading photos...</>
            ) : isAnalyzing ? (
              <><Loader size={15} className="animate-spin" /> Analyzing...</>
            ) : !allUploaded ? (
              <>Upload all {REQUIRED_ANGLES.length} photos first</>
            ) : !aiResult ? (
              <>Run AI Check first</>
            ) : !aiResult.sellable ? (
              <><ShieldX size={15} /> Not approved for listing</>
            ) : (
              <><Plus size={15} /> Publish Listing</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
