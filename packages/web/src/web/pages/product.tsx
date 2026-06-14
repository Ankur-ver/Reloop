import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { api } from "../lib/api";
import { Shield, Coins, Leaf, ArrowLeft, Eye, Zap, CheckCircle, ShoppingCart, Heart, Gift, RefreshCw, ChevronDown, ChevronUp, MapPin, Star, Tag } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "../components/toast";
import { useCart } from "../components/cart-context";
import { DonateModal } from "../components/donate-modal";

const gradeConfig: Record<string, { color: string; label: string; desc: string }> = {
  excellent: { color: "#22C55E", label: "Excellent", desc: "Like new — minimal to no signs of use" },
  good: { color: "#3B82F6", label: "Good", desc: "Minor cosmetic wear, fully functional" },
  fair: { color: "#F59E0B", label: "Fair", desc: "Visible wear, all functions working" },
  poor: { color: "#EF4444", label: "Poor", desc: "Heavy wear, may have minor issues" },
};

const dispositionInfo: Record<string, { color: string; label: string }> = {
  resell: { color: "#22C55E", label: "Direct Resell" },
  refurbish: { color: "#3B82F6", label: "Refurbished" },
  exchange: { color: "#8B5CF6", label: "Exchange" },
  donate: { color: "#F59E0B", label: "Donation" },
};

function ReturnedReplicaCard({ replica, onAddToCart }: { replica: any; onAddToCart: (r: any) => void }) {
  const grade = gradeConfig[replica.qualityGrade] || gradeConfig.good;
  const savings = Math.round(((replica.originalPrice - replica.reloopPrice) / replica.originalPrice) * 100);
  const disposition = dispositionInfo[replica.disposition] || dispositionInfo.resell;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "var(--color-bg-elevated)", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      <div className="relative">
        <img src={replica.imageUrl} alt={replica.title} className="w-full h-44 object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,24,39,0.75) 0%, transparent 55%)" }} />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.color + "25", color: grade.color, backdropFilter: "blur(8px)" }}>
            {grade.label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "rgba(34,197,94,0.2)", color: "#22C55E", backdropFilter: "blur(8px)" }}>
            <RefreshCw size={9} /> Returned
          </span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#EF4444", color: "#fff" }}>
          -{savings}%
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-medium mb-0.5" style={{ color: "var(--color-text-muted)" }}>{replica.brand}</div>
        <div className="font-semibold text-sm mb-2 leading-tight flex-1" style={{ color: "var(--color-text-primary)" }}>{replica.title}</div>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-black" style={{ color: "var(--color-accent-green)" }}>₹{replica.reloopPrice.toLocaleString()}</span>
          <span className="text-sm line-through" style={{ color: "var(--color-text-muted)" }}>₹{replica.originalPrice.toLocaleString()}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          <span className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
            <Coins size={11} /> +{replica.greenCreditsEarned} credits
          </span>
          <span className="flex items-center gap-1">
            <Leaf size={11} style={{ color: "#22C55E" }} /> {replica.co2SavedKg}kg CO₂
          </span>
        </div>

        {/* AI score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: "var(--color-text-muted)" }}>AI Grade</span>
            <span style={{ color: grade.color }}>{replica.qualityScore}/100</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${replica.qualityScore}%`, background: grade.color }} />
          </div>
        </div>

        {/* Disposition */}
        <div className="mb-4">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: disposition.color + "15", color: disposition.color }}>
            {disposition.label}
          </span>
          {replica.isCertified && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex-inline items-center gap-1" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
              <Shield size={9} className="inline mr-0.5" /> Certified
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onAddToCart(replica)}
          className="w-full py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [showReplicas, setShowReplicas] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.products[":id"].$get({ param: { id: id! } });
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch returned replicas — only runs after product loads
  const product = (data as any)?.product;
  const { data: replicaData, isLoading: replicaLoading } = useQuery({
    queryKey: ["returned-replicas", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}/returned-replicas`);
      return res.json();
    },
    enabled: !!product && !product.isReturnedItem, // only query replicas for original products
  });

  const replicas: any[] = (replicaData as any)?.replicas || [];

  if (isLoading) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-10">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="h-80 rounded-2xl" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="space-y-4">
            <div className="h-4 rounded w-1/3" style={{ background: "var(--color-bg-elevated)" }} />
            <div className="h-8 rounded w-3/4" style={{ background: "var(--color-bg-elevated)" }} />
            <div className="h-6 rounded w-1/2" style={{ background: "var(--color-bg-elevated)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="max-w-screen-lg mx-auto px-4 py-20 text-center" style={{ color: "var(--color-text-muted)" }}>
      Product not found.
    </div>
  );

  const grade = gradeConfig[product.qualityGrade] || gradeConfig.good;
  const disposition = dispositionInfo[product.disposition] || dispositionInfo.resell;
  const savings = Math.round(((product.originalPrice - product.reloopPrice) / product.originalPrice) * 100);

  const donateListing = {
    id: 0,
    title: product.title,
    category: product.category,
    condition: product.qualityGrade,
    imageUrl: product.imageUrl,
    imageUrls: JSON.stringify([product.imageUrl]),
    location: "India",
    description: product.description ?? "",
    qualityGrade: product.qualityGrade,
    aiScore: product.qualityScore,
    aiVerdict: null,
    aiReasoning: null,
    aiPositives: null,
    aiConcerns: null,
    isRecyclable: false,
    recycleData: null,
  };

  const handleAddToCart = (p = product) => {
    addItem({
      id: p.id,
      title: p.title,
      brand: p.brand,
      imageUrl: p.imageUrl,
      reloopPrice: p.reloopPrice,
      originalPrice: p.originalPrice,
      qualityGrade: p.qualityGrade,
      greenCreditsEarned: p.greenCreditsEarned,
    });
    if (p.id === product.id) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
    }
    toast(`${p.title} added to cart!`, "success");
  };

  const handleWishlist = () => {
    setWishlisted((prev) => {
      const next = !prev;
      toast(next ? "Added to wishlist!" : "Removed from wishlist.", next ? "success" : "info");
      return next;
    });
  };

  const hasReplicas = replicas.length > 0;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      <Link to="/marketplace">
        <div className="flex items-center gap-2 mb-8 cursor-pointer text-sm" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={15} /> Back to Marketplace
        </div>
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)" }}>
            <img src={product.imageUrl} alt={product.title} className="w-full h-96 object-cover" />
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: grade.color + "20", color: grade.color }}>
              {grade.label}
            </span>
            {product.isCertified && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "rgba(34,197,94,0.2)", color: "#22C55E" }}>
                <Shield size={11} /> ReLoop Certified
              </span>
            )}
          </div>
          {savings > 0 && (
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold" style={{ background: "#EF4444", color: "#fff" }}>
              -{savings}% OFF
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(0,0,0,0.6)", color: "var(--color-text-secondary)" }}>
            <Eye size={12} /> {product.views} views
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{product.brand}</div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>{product.title}</h1>

          <div className="flex items-center gap-2 mb-5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sold by:
            <span className="font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
              {product.sellerName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: disposition.color + "15", color: disposition.color }}>
              {disposition.label}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-5">
            <div className="text-4xl font-black" style={{ color: "var(--color-text-primary)" }}>₹{product.reloopPrice.toLocaleString()}</div>
            {savings > 0 && <>
              <div className="text-lg line-through" style={{ color: "var(--color-text-muted)" }}>₹{product.originalPrice.toLocaleString()}</div>
              <div className="px-2 py-0.5 rounded-full text-sm font-bold" style={{ background: "#EF4444", color: "#fff" }}>-{savings}%</div>
            </>}
          </div>

          <div className="p-4 rounded-xl mb-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>AI Quality Assessment</div>
              <div className="text-sm font-semibold" style={{ color: grade.color }}>{product.qualityScore}/100</div>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: "var(--color-border)" }}>
              <div className="h-2 rounded-full" style={{ width: `${product.qualityScore}%`, background: grade.color }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{grade.desc}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.color + "15", color: grade.color }}>{grade.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Coins size={16} style={{ color: "#F59E0B" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#F59E0B" }}>+{product.greenCreditsEarned}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Green Credits</div>
              </div>
            </div>
            <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Leaf size={16} style={{ color: "#22C55E" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#22C55E" }}>{product.co2SavedKg}kg</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>CO₂ Saved</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {[
              "AI Quality Graded & Verified",
              "180-day warranty included",
              "Free returns within 30 days",
              "Secure Amazon payment",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <CheckCircle size={14} style={{ color: "var(--color-accent-green)" }} />
                {item}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleAddToCart()}
              className="flex-1 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: cartAdded ? "#16A34A" : "var(--color-accent-green)", color: "#0A0F1E" }}
            >
              {cartAdded ? <><CheckCircle size={16} /> Added!</> : <><ShoppingCart size={16} /> Add to Cart</>}
            </button>
            <button
              onClick={() => setDonateModal(true)}
              className="px-5 py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", color: "#F59E0B" }}
              title="Donate this item"
            >
              <Gift size={16} /> Donate
            </button>
            <button
              onClick={handleWishlist}
              className="px-5 py-3.5 rounded-full font-semibold transition-all"
              style={{
                border: `1px solid ${wishlisted ? "#EF4444" : "var(--color-border)"}`,
                color: wishlisted ? "#EF4444" : "var(--color-text-secondary)",
                background: wishlisted ? "rgba(239,68,68,0.08)" : "transparent",
              }}
            >
              <Heart size={16} fill={wishlisted ? "#EF4444" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Returned Replica Banner ─────────────────────────────── */}
      {!product.isReturnedItem && (
        <div className="mt-8">
          {replicaLoading ? (
            <div className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--color-bg-card)" }} />
          ) : hasReplicas ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.3)" }}>
              {/* Banner trigger */}
              <button
                onClick={() => setShowReplicas((v) => !v)}
                className="w-full flex items-center justify-between p-5 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                    <RefreshCw size={18} style={{ color: "#22C55E" }} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {replicas.length} Returned {replicas.length === 1 ? "Replica" : "Replicas"} Available Nearby
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      Same product returned by nearby customers — AI-graded, certified &amp; up to{" "}
                      <span style={{ color: "#22C55E", fontWeight: 600 }}>
                        {Math.max(...replicas.map((r: any) => Math.round(((r.originalPrice - r.reloopPrice) / r.originalPrice) * 100)))}% cheaper
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                    Save more
                  </span>
                  {showReplicas ? <ChevronUp size={18} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} />}
                </div>
              </button>

              {/* Expanded replicas */}
              {showReplicas && (
                <div className="p-5 pt-0" style={{ background: "var(--color-bg-card)" }}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 py-4 border-b mb-5" style={{ borderColor: "var(--color-border)" }}>
                    <MapPin size={14} style={{ color: "var(--color-accent-green)" }} />
                    <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Showing returned versions of <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{product.title}</span> from your region
                    </span>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                      <Shield size={10} className="inline mr-1" />ReLoop Certified
                    </span>
                  </div>

                  {/* Replica cards grid */}
                  <div className={`grid gap-4 ${replicas.length === 1 ? "grid-cols-1 max-w-sm" : replicas.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}>
                    {replicas.map((replica: any) => (
                      <ReturnedReplicaCard
                        key={replica.id}
                        replica={replica}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>

                  {/* Footer note */}
                  <div className="mt-5 p-3 rounded-xl flex items-start gap-3 text-xs" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <Leaf size={13} style={{ color: "#22C55E", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Buying a returned replica instead of new saves an extra{" "}
                      <span style={{ color: "#22C55E", fontWeight: 600 }}>
                        ~{(replicas[0]?.co2SavedKg || 2.4).toFixed(1)}kg CO₂
                      </span>{" "}
                      and earns you additional Green Credits. Every returned purchase keeps products out of landfill.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No replicas — subtle prompt to return a similar product */
            <div className="p-5 rounded-2xl flex items-center gap-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
                <RefreshCw size={18} style={{ color: "#22C55E" }} />
              </div>
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>No returned replicas nearby yet</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Own this product? Return it via ReLoop and earn Green Credits — your listing will appear here for other buyers.
                </div>
              </div>
              <Link to="/return">
                <button className="ml-auto px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }}>
                  Return a Product
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="mt-8 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>About This Product</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{product.description}</p>
      </div>

      {/* Browse more */}
      <div className="mt-4 p-5 rounded-2xl flex items-center justify-between" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <div>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Looking for more options?</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Browse more certified products in {product.category}</div>
        </div>
        <Link to={`/marketplace`}>
          <button className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
            Browse More
          </button>
        </Link>
      </div>

      {donateModal && (
        <DonateModal listing={donateListing} onClose={() => setDonateModal(false)} />
      )}
    </div>
  );
}
