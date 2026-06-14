import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";
import { ShoppingBag, Shield, Coins, Filter, Search, Leaf, Zap, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "../components/cart-context";

const gradeConfig: Record<string, { color: string; label: string; bg: string }> = {
  excellent: { color: "#22C55E", label: "Excellent", bg: "rgba(34,197,94,0.12)" },
  good: { color: "#3B82F6", label: "Good", bg: "rgba(59,130,246,0.12)" },
  fair: { color: "#F59E0B", label: "Fair", bg: "rgba(245,158,11,0.12)" },
  poor: { color: "#EF4444", label: "Poor", bg: "rgba(239,68,68,0.12)" },
};

const dispositionBadge: Record<string, { color: string; label: string }> = {
  resell: { color: "#22C55E", label: "ReLoop Certified" },
  refurbish: { color: "#3B82F6", label: "Refurbished" },
  exchange: { color: "#8B5CF6", label: "Exchange" },
};

const categories = ["All", "electronics", "clothing", "footwear", "appliances", "furniture"];
const grades = ["All", "excellent", "good", "fair"];

function ProductCard({ product }: { product: any }) {
  const { addItem, openCart } = useCart();
  const grade = gradeConfig[product.qualityGrade] || gradeConfig.good;
  const disposition = dispositionBadge[product.disposition] || dispositionBadge.resell;
  const savings = Math.round(((product.originalPrice - product.reloopPrice) / product.originalPrice) * 100);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      title: product.title,
      brand: product.brand,
      imageUrl: product.imageUrl,
      reloopPrice: product.reloopPrice,
      originalPrice: product.originalPrice,
      qualityGrade: product.qualityGrade,
      greenCreditsEarned: product.greenCreditsEarned,
    });
    openCart();
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      title: product.title,
      brand: product.brand,
      imageUrl: product.imageUrl,
      reloopPrice: product.reloopPrice,
      originalPrice: product.originalPrice,
      qualityGrade: product.qualityGrade,
      greenCreditsEarned: product.greenCreditsEarned,
    });
    openCart();
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <Link to={`/product/${product.id}`}>
          <div className="relative cursor-pointer">
            <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,24,39,0.8) 0%, transparent 60%)" }} />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: grade.bg, color: grade.color, backdropFilter: "blur(8px)" }}>
                {grade.label}
              </span>
              {product.isCertified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: "rgba(34,197,94,0.2)", color: "#22C55E", backdropFilter: "blur(8px)" }}>
                  <Shield size={10} /> Certified
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#EF4444", color: "#fff" }}>
              -{savings}%
            </div>
          </div>
          <div className="p-4 pb-2">
            <div className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{product.brand}</div>
            <div className="font-semibold text-sm mb-3 leading-tight" style={{ color: "var(--color-text-primary)" }}>{product.title}</div>
            <div className="flex items-end gap-2 mb-2">
              <div className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>₹{product.reloopPrice.toLocaleString()}</div>
              <div className="text-sm line-through" style={{ color: "var(--color-text-muted)" }}>₹{product.originalPrice.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-xs" style={{ color: "#F59E0B" }}>
                <Coins size={12} />
                <span className="font-semibold">+{product.greenCreditsEarned} credits</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <Leaf size={11} style={{ color: "#22C55E" }} />
                <span>{product.co2SavedKg}kg CO₂ saved</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            className="flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
          >
            <ShoppingCart size={12} /> Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
            style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" }}
          >
            <Zap size={12} /> Buy Now
          </button>
        </div>
      </div>
    </>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, selectedGrade, search],
    queryFn: async () => {
      const params: any = {};
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedGrade !== "All") params.grade = selectedGrade;
      if (search) params.search = search;
      const res = await api.products.$get({ query: params });
      return res.json();
    },
  });

  const products = (data as any)?.products || [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>
          <Shield size={11} /> CERTIFIED SECOND-LIFE MARKETPLACE
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>ReLoop Marketplace</h1>
        <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
          Browse AI-graded, certified products at up to 60% off. Every purchase prevents waste and earns Green Credits.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all capitalize"
              style={{
                background: selectedCategory === c ? "var(--color-accent-green)" : "var(--color-bg-card)",
                color: selectedCategory === c ? "#0A0F1E" : "var(--color-text-secondary)",
                border: selectedCategory === c ? "none" : "1px solid var(--color-border)",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grade filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <div className="flex items-center gap-1.5 text-sm mr-2" style={{ color: "var(--color-text-muted)" }}>
          <Filter size={14} /> Grade:
        </div>
        {grades.map((g) => {
          const grade = gradeConfig[g];
          return (
            <button key={g} onClick={() => setSelectedGrade(g)}
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all"
              style={{
                background: selectedGrade === g ? (grade?.bg || "rgba(34,197,94,0.12)") : "var(--color-bg-card)",
                color: selectedGrade === g ? (grade?.color || "var(--color-accent-green)") : "var(--color-text-secondary)",
                border: `1px solid ${selectedGrade === g ? (grade?.color || "#22C55E") + "40" : "var(--color-border)"}`,
              }}>
              {g}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {isLoading ? "Loading..." : `${products.length} products found`}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-accent-green)" }}>
          <Leaf size={13} />
          <span>Each purchase saves avg. 2.8kg CO₂</span>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--color-bg-card)" }}>
              <div className="h-48" style={{ background: "var(--color-bg-elevated)" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded" style={{ background: "var(--color-bg-elevated)" }} />
                <div className="h-4 rounded w-3/4" style={{ background: "var(--color-bg-elevated)" }} />
                <div className="h-5 rounded w-1/2" style={{ background: "var(--color-bg-elevated)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
          <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
          <p>No products found. Try adjusting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Impact Banner */}
      <div className="mt-12 p-6 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.05))", border: "1px solid rgba(34,197,94,0.15)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={16} style={{ color: "var(--color-accent-green)" }} />
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Buy Refurbished. Save More. Impact More.</span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Every certified product you buy prevents landfill waste and earns you Green Credits for future discounts.
        </p>
      </div>
    </div>
  );
}
