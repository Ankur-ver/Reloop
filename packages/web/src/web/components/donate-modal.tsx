import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Heart, Loader, CheckCircle, Building, School, Home, Users } from "lucide-react";
import { useToast } from "./toast";
const API_URL = import.meta.env.VITE_API_URL;
const RECIPIENT_TYPES = [
  { id: "ngo", label: "NGO / Charity", icon: Heart, desc: "Donate to registered non-profits" },
  { id: "school", label: "School / Education", icon: School, desc: "Support students & learning centres" },
  { id: "shelter", label: "Shelter / Care Home", icon: Home, desc: "Help shelters and care facilities" },
  { id: "community", label: "Community Centre", icon: Users, desc: "Benefit local communities" },
];

interface Props {
  listing: any;
  onClose: () => void;
}

export function DonateModal({ listing, onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [donateReason, setDonateReason] = useState("");
  const [recipientType, setRecipientType] = useState("ngo");
  const [success, setSuccess] = useState(false);

  const donateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/p2p/donations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id ?? 0,
          // send full product fields so server can use them if no DB listing exists
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          imageUrl: listing.imageUrl,
          imageUrls: listing.imageUrls,
          location: listing.location,
          description: listing.description,
          aiScore: listing.aiScore,
          qualityGrade: listing.qualityGrade,
          aiVerdict: listing.aiVerdict,
          aiReasoning: listing.aiReasoning,
          aiPositives: listing.aiPositives,
          aiConcerns: listing.aiConcerns,
          isRecyclable: listing.isRecyclable,
          recycleData: listing.recycleData,
          donateReason,
          recipientType,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || "Donation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["p2p-listings"] });
      qc.invalidateQueries({ queryKey: ["p2p-donations"] });
      setSuccess(true);
    },
    onError: (err: any) => {
      toast(err.message || "Donation failed", "error");
    },
  });

  const inputStyle = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  if (success) {
    return (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.15)" }}>
            <CheckCircle size={32} style={{ color: "#22C55E" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Donation Submitted!</h2>
          <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{listing.title}</span> has been submitted for donation.
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
            Our team will match it with the best recipient organisation and notify you once delivered.
          </p>
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Heart size={14} style={{ color: "#22C55E" }} />
            <span className="text-sm font-semibold" style={{ color: "#22C55E" }}>+75 Green Credits Earned</span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm font-semibold"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)" }}>
              <Heart size={18} style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>Donate This Item</h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Earn 75 Green Credits for donating</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
            <img
              src={listing.imageUrl || "https://placehold.co/60x60/1a2332/4ade80?text=Item"}
              alt={listing.title}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{listing.title}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{listing.condition} · {listing.category}</div>
              {listing.aiScore != null && (
                <div className="text-xs mt-0.5" style={{ color: "#8B5CF6" }}>AI Score: {listing.aiScore}/100</div>
              )}
            </div>
          </div>

          {/* Recipient type */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
              Who should receive this? <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RECIPIENT_TYPES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setRecipientType(id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: recipientType === id ? "rgba(34,197,94,0.1)" : "var(--color-bg-elevated)",
                    border: `1px solid ${recipientType === id ? "rgba(34,197,94,0.4)" : "var(--color-border)"}`,
                  }}
                >
                  <Icon size={16} className="mb-1.5" style={{ color: recipientType === id ? "#22C55E" : "var(--color-text-muted)" }} />
                  <div className="text-xs font-semibold" style={{ color: recipientType === id ? "#22C55E" : "var(--color-text-primary)" }}>{label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>
              Why are you donating? <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. No longer needed, upgrading to a new model, want to help someone in need..."
              value={donateReason}
              onChange={(e) => setDonateReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          {/* Green credit info */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Building size={13} style={{ color: "#22C55E" }} />
              <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>How it works</span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              ReLoop will match your item with a verified organisation. We handle pickup, quality check, and delivery. You earn <span className="font-semibold" style={{ color: "#22C55E" }}>75 Green Credits</span> once delivered.
            </p>
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
            onClick={() => donateMutation.mutate()}
            disabled={donateMutation.isPending || !donateReason.trim()}
            className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#22C55E", color: "#0A0F1E" }}
          >
            {donateMutation.isPending ? (
              <><Loader size={14} className="animate-spin" /> Submitting...</>
            ) : (
              <><Heart size={14} /> Donate Item</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
