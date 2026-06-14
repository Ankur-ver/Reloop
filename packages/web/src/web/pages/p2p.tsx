import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";
import {
  Users, MapPin, Eye, Star, Search, Plus, Shield, Coins,
  ShoppingCart, Zap, Heart, Recycle, CheckCircle,
  CircleDot, ChevronDown, ChevronUp, Leaf, Droplets,
} from "lucide-react";
import { ListItemModal } from "../components/list-item-modal";
import { authClient } from "../lib/auth";
import { Link, useLocation } from "wouter";
import { useCart } from "../components/cart-context";

function parseJSON(str: string | null | undefined, fallback: any = []) {
  if (!str) return fallback;
  try { return typeof str === "string" ? JSON.parse(str) : str; } catch { return fallback; }
}

const gradeConfig: Record<string, { color: string; label: string }> = {
  excellent: { color: "#22C55E", label: "Excellent" },
  good: { color: "#3B82F6", label: "Good" },
  fair: { color: "#F59E0B", label: "Fair" },
  poor: { color: "#EF4444", label: "Poor" },
};

function AIDetailPanel({ listing }: { listing: any }) {
  const [open, setOpen] = useState(false);
  const positives: string[] = parseJSON(listing.aiPositives);
  const concerns: string[] = parseJSON(listing.aiConcerns);
  const recycleData = parseJSON(listing.recycleData, null);
  const grade = gradeConfig[listing.qualityGrade] || gradeConfig.good;

  if (!listing.aiScore && !listing.aiVerdict && !listing.aiReasoning) return null;

  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="flex items-center gap-2">
          <Star size={12} style={{ color: "#8B5CF6" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>AI Analysis</span>
          {listing.aiScore != null && (
            <span className="text-xs font-bold" style={{ color: "#8B5CF6" }}>{listing.aiScore}/100</span>
          )}
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: grade.color + "20", color: grade.color }}>
            {grade.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{open ? "Hide" : "More"}</span>
          {open ? <ChevronUp size={12} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={12} style={{ color: "var(--color-text-muted)" }} />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 space-y-3" style={{ background: "var(--color-bg-card)" }}>
          {/* Score bar */}
          {listing.aiScore != null && (
            <div className="h-1.5 rounded-full w-full" style={{ background: "var(--color-bg-elevated)" }}>
              <div className="h-1.5 rounded-full" style={{ width: `${listing.aiScore}%`, background: grade.color }} />
            </div>
          )}

          {listing.aiVerdict && (
            <p className="text-xs italic" style={{ color: "var(--color-text-secondary)" }}>"{listing.aiVerdict}"</p>
          )}

          {positives.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1" style={{ color: "#22C55E" }}>Positives</div>
              {positives.map((p, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs mb-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  <CheckCircle size={10} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} /> {p}
                </div>
              ))}
            </div>
          )}

          {concerns.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold mb-1" style={{ color: "#F59E0B" }}>Concerns</div>
              {concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs mb-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  <CircleDot size={10} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} /> {c}
                </div>
              ))}
            </div>
          )}

          {listing.aiReasoning && (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "#8B5CF6" }}>AI: </span>
              {listing.aiReasoning}
            </p>
          )}

          {/* Recyclability inline */}
          {recycleData && (
            <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Recycle size={11} style={{ color: listing.isRecyclable ? "#22C55E" : "#6B7280" }} />
                <span className="text-[10px] font-semibold" style={{ color: listing.isRecyclable ? "#22C55E" : "#6B7280" }}>
                  {listing.isRecyclable ? "Recyclable" : "Not Easily Recyclable"}
                </span>
                {recycleData.recycleScore != null && (
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>· {recycleData.recycleScore}/100</span>
                )}
              </div>
              {recycleData.materials?.length > 0 && (
                <>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-1.5">
                    {recycleData.materials.map((m: any, i: number) => (
                      <div key={i} style={{ width: `${m.percentage}%`, background: m.color || "#3B82F6", minWidth: 2 }} title={`${m.name}: ${m.percentage}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {recycleData.materials.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-1 text-[10px]">
                        <div className="w-2 h-2 rounded-full" style={{ background: m.color || "#3B82F6" }} />
                        <span style={{ color: "var(--color-text-muted)" }}>{m.name} {m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {(recycleData.environmentalImpact?.co2SavedKg) && (
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[10px]">
                    <Leaf size={9} style={{ color: "#22C55E" }} />
                    <span style={{ color: "var(--color-text-muted)" }}>{recycleData.environmentalImpact.co2SavedKg}kg CO₂</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Droplets size={9} style={{ color: "#3B82F6" }} />
                    <span style={{ color: "var(--color-text-muted)" }}>{recycleData.environmentalImpact.waterSavedL}L water</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: any }) {
  const { addItem, openCart } = useCart();
  const grade = gradeConfig[listing.qualityGrade] || gradeConfig.good;
  const savings = listing.originalPrice > listing.price
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : 0;
  const isSold = listing.status === "sold";

  const toCartItem = () => ({
    id: String(listing.id),
    title: listing.title,
    brand: listing.sellerName ?? "Unknown",
    imageUrl: listing.imageUrl,
    reloopPrice: listing.price,
    originalPrice: listing.originalPrice,
    qualityGrade: listing.qualityGrade ?? "good",
    greenCreditsEarned: 0,
  });

  return (
    <>

      <div className="card-hover rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div className="relative">
          <img
            src={listing.imageUrl || "https://placehold.co/400x300/1a2332/4ade80?text=No+Image"}
            alt={listing.title}
            className="w-full h-48 object-cover"
            loading="lazy"
            style={{ filter: isSold ? "grayscale(60%)" : "none" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300/1a2332/4ade80?text=No+Image"; }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,24,39,0.7) 0%, transparent 60%)" }} />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.color + "20", color: grade.color, backdropFilter: "blur(8px)" }}>
              {grade.label}
            </span>
            {isSold && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(107,114,128,0.85)", color: "#fff", backdropFilter: "blur(8px)" }}>
                Donated/Sold
              </span>
            )}
          </div>
          {!isSold && savings > 0 && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#EF4444", color: "#fff" }}>
              -{savings}%
            </div>
          )}
          {/* Recyclable badge */}
          {listing.isRecyclable && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: "rgba(34,197,94,0.85)", color: "#fff", backdropFilter: "blur(6px)" }}>
              <Recycle size={9} /> Recyclable
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
            <MapPin size={11} /> {listing.location}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{listing.category}</div>
          <div className="font-semibold text-sm mb-1 leading-tight" style={{ color: "var(--color-text-primary)" }}>{listing.title}</div>
          <div className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>Condition: {listing.condition}</div>

          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-lg font-bold" style={{ color: isSold ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
              ₹{listing.price.toLocaleString()}
            </div>
            {listing.originalPrice > listing.price && (
              <div className="text-sm line-through" style={{ color: "var(--color-text-muted)" }}>₹{listing.originalPrice.toLocaleString()}</div>
            )}
          </div>

          <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                {listing.sellerName?.charAt(0) ?? "U"}
              </div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{listing.sellerName}</span>
              {listing.sellerRating != null ? (
                <>
                  <Star size={10} style={{ color: "#F59E0B" }} />
                  <span className="text-xs" style={{ color: "#F59E0B" }}>{Number(listing.sellerRating).toFixed(1)}</span>
                </>
              ) : listing.aiScore != null ? (
                <>
                  <Star size={10} style={{ color: "#8B5CF6" }} />
                  <span className="text-xs" style={{ color: "#8B5CF6" }}>AI {listing.aiScore}</span>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <Eye size={11} /> {listing.views ?? 0}
            </div>
          </div>

          {/* Buy buttons — only these show on the card front */}
          <div className="flex gap-2">
            <button
              onClick={() => { if (!isSold) { addItem(toCartItem()); } }}
              disabled={isSold}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                border: `1px solid ${isSold ? "var(--color-border)" : "var(--color-accent-green)"}`,
                color: isSold ? "var(--color-text-muted)" : "var(--color-accent-green)",
                background: "transparent",
                cursor: isSold ? "not-allowed" : "pointer",
                opacity: isSold ? 0.5 : 1,
              }}
            >
              <ShoppingCart size={12} /> Add to Cart
            </button>
            <button
              onClick={() => { if (!isSold) { addItem(toCartItem()); openCart(); } }}
              disabled={isSold}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{
                background: isSold ? "var(--color-bg-elevated)" : "var(--color-accent-green)",
                color: isSold ? "var(--color-text-muted)" : "#0A0F1E",
                cursor: isSold ? "not-allowed" : "pointer",
                opacity: isSold ? 0.5 : 1,
              }}
            >
              <Zap size={12} /> Buy Now
            </button>
          </div>

          {/* AI analysis expandable panel */}
          <AIDetailPanel listing={listing} />
        </div>
      </div>
    </>
  );
}

export default function P2PPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["p2p-listings"],
    queryFn: async () => (await api.p2p.listings.$get()).json(),
  });

  const listings = ((data as any)?.listings || []).filter((l: any) =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleListItem = () => {
    if (!session) { navigate("/sign-in"); return; }
    setShowModal(true);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {showModal && <ListItemModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
            <Users size={11} /> PEER-TO-PEER RESALE
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>P2P Marketplace</h1>
          <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
            Buy directly from verified Amazon customers. Safe, trusted, and eco-friendly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/p2p/donations">
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}>
              <Heart size={14} /> Donated Items
            </button>
          </Link>
          <button
            onClick={handleListItem}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
            <Plus size={15} /> List an Item
          </button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Shield, label: "Verified Sellers", desc: "All sellers identity-verified via Amazon account", color: "#22C55E" },
          { icon: Coins, label: "Secure Payments", desc: "Amazon payment protection on every transaction", color: "#F59E0B" },
          { icon: Star, label: "Buyer Guarantee", desc: "30-day return policy on all P2P purchases", color: "#3B82F6" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="p-4 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <Icon size={18} className="mb-2" style={{ color }} />
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{label}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Search listings, sellers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
        {isLoading ? "Loading..." : `${listings.length} active listings`}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--color-bg-card)" }}>
              <div className="h-48" style={{ background: "var(--color-bg-elevated)" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded w-1/3" style={{ background: "var(--color-bg-elevated)" }} />
                <div className="h-4 rounded" style={{ background: "var(--color-bg-elevated)" }} />
                <div className="h-5 rounded w-1/2" style={{ background: "var(--color-bg-elevated)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
          <Users size={40} className="mx-auto mb-4 opacity-30" />
          <p>No listings found.</p>
          <button onClick={handleListItem} className="mt-4 px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
            Be the first to list
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {listings.map((l: any) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 p-8 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))", border: "1px solid rgba(139,92,246,0.2)" }}>
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Have something to sell or donate?</h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          List your unused items on ReLoop P2P in under 2 minutes. Sell, donate, or recycle responsibly.
        </p>
        <button onClick={handleListItem} className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#8B5CF6", color: "#fff" }}>
          <Plus size={15} className="inline mr-2" />Start Selling
        </button>
      </div>
    </div>
  );
}
