import { X, ShoppingCart, Trash2, Plus, Minus, Coins, ArrowRight, Loader2 } from "lucide-react";
import { useCart } from "./cart-context";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../lib/api";

const gradeColors: Record<string, string> = {
  excellent: "#22C55E",
  good: "#3B82F6",
  fair: "#F59E0B",
  poor: "#EF4444",
};

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, count, clearCart } = useCart();
  const [, navigate] = useLocation();
  const totalCredits = items.reduce((sum, i) => sum + i.greenCreditsEarned * i.quantity, 0);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.orders.place.$post({
        json: {
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            brand: i.brand,
            imageUrl: i.imageUrl,
            reloopPrice: i.reloopPrice,
            originalPrice: i.originalPrice,
            qualityGrade: i.qualityGrade,
            greenCreditsEarned: i.greenCreditsEarned,
            quantity: i.quantity,
          })),
        },
      });
      if (!res.ok) throw new Error("Order failed");
      return res.json();
    },
    onSuccess: (data) => {
      clearCart();
      closeCart();
      // Pass full result via history state so confirm page can read it
      window.history.replaceState({ orderResult: data }, "");
      navigate(`/orders/confirm?ref=${data.orderRef}`);
    },
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full max-w-sm transition-transform duration-300 ease-in-out"
        style={{
          background: "var(--color-bg-card)",
          borderLeft: "1px solid var(--color-border)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: isOpen ? "-20px 0 60px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: "var(--color-accent-green)" }} />
            <span className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
              Cart
            </span>
            {count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--color-bg-elevated)" }}>
                <ShoppingCart size={28} style={{ color: "var(--color-text-muted)" }} />
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>Your cart is empty</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Browse the marketplace to add sustainable products</p>
              </div>
              <button
                onClick={closeCart}
                className="px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            items.map((item) => {
              const gradeColor = gradeColors[item.qualityGrade] ?? "#3B82F6";
              const savings = Math.round(((item.originalPrice - item.reloopPrice) / item.originalPrice) * 100);
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-3 flex gap-3"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{item.brand}</div>
                    <div className="text-sm font-semibold leading-snug mb-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: gradeColor + "20", color: gradeColor }}>
                        {item.qualityGrade}
                      </span>
                      <span className="text-xs" style={{ color: "#EF4444" }}>-{savings}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: "var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center" style={{ color: "var(--color-text-primary)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: "var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      {/* Price + delete */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                          ₹{(item.reloopPrice * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded-lg transition-colors"
                          style={{ color: "#EF4444" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: "var(--color-border)" }}>
            {/* Green impact */}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-accent-green)" }}>
                <Coins size={14} />
                <span>Green Credits earned</span>
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--color-accent-green)" }}>+{totalCredits}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>Total ({count} item{count > 1 ? "s" : ""})</span>
              <span className="text-xl font-black" style={{ color: "var(--color-text-primary)" }}>₹{total.toLocaleString()}</span>
            </div>

            {/* Checkout button */}
            <button
              disabled={checkoutMutation.isPending}
              className="w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Placing Order...
                </>
              ) : (
                <>
                  Proceed to Checkout <ArrowRight size={16} />
                </>
              )}
            </button>
            {checkoutMutation.isError && (
              <p className="text-xs text-center" style={{ color: "#EF4444" }}>
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
