import { useLocation } from "wouter";
import { CheckCircle, Package, Truck, MapPin, ArrowRight, Leaf, Coins, ShoppingBag } from "lucide-react";

interface OrderItem {
  title: string;
  brand: string;
  imageUrl: string;
  reloopPrice: number;
  quantity: number;
  qualityGrade: string;
  greenCreditsEarned: number;
}

interface OrderResult {
  orderRef: string;
  itemCount: number;
  totalAmount: number;
  greenCreditsEarned: number;
  estimatedDelivery: string;
  items?: OrderItem[];
}

const gradeColors: Record<string, string> = {
  excellent: "#22C55E",
  good: "#3B82F6",
  fair: "#F59E0B",
  poor: "#EF4444",
};

const deliverySteps = [
  { label: "Order Placed", icon: CheckCircle, done: true },
  { label: "Processing", icon: Package, done: true },
  { label: "Out for Delivery", icon: Truck, done: false },
  { label: "Delivered", icon: MapPin, done: false },
];

export default function OrderConfirmPage() {
  const [, navigate] = useLocation();

  // Read state passed via wouter navigate or fall back to URL query param
  const searchParams = new URLSearchParams(window.location.search);
  const refFromUrl = searchParams.get("ref") ?? "RLP-XXXXXX-0000";

  // Try to get full result from history state (wouter passes it there)
  const historyState = (window.history.state ?? {}) as { orderResult?: OrderResult };
  const result: OrderResult = historyState.orderResult ?? {
    orderRef: refFromUrl,
    itemCount: 1,
    totalAmount: 0,
    greenCreditsEarned: 0,
    estimatedDelivery: new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    }),
    items: [],
  };

  const deliveryDate = result.estimatedDelivery
    ? new Date(result.estimatedDelivery).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long",
      })
    : new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long",
      });

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "var(--color-bg-primary)" }}>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Success hero */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(34,197,94,0.12)" }}
          >
            <CheckCircle size={40} style={{ color: "var(--color-accent-green)" }} />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: "var(--color-text-primary)" }}>
            Order Confirmed!
          </h1>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
            Your sustainable purchase is on its way
          </p>
          <div
            className="inline-block px-4 py-2 rounded-full text-xs font-bold tracking-widest"
            style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            {result.orderRef}
          </div>
        </div>

        {/* Green impact */}
        {result.greenCreditsEarned > 0 && (
          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                <Leaf size={18} style={{ color: "var(--color-accent-green)" }} />
              </div>
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-text-muted)" }}>Green Credits Earned</div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>For choosing sustainable products</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins size={16} style={{ color: "var(--color-accent-green)" }} />
              <span className="text-xl font-black" style={{ color: "var(--color-accent-green)" }}>
                +{result.greenCreditsEarned}
              </span>
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>Order Summary</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {result.items && result.items.length > 0 ? (
              result.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{item.brand}</div>
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{item.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: (gradeColors[item.qualityGrade] ?? "#3B82F6") + "20",
                          color: gradeColors[item.qualityGrade] ?? "#3B82F6",
                        }}
                      >
                        {item.qualityGrade}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>×{item.quantity}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    ₹{(item.reloopPrice * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <ShoppingBag size={14} />
                <span>{result.itemCount} item{result.itemCount !== 1 ? "s" : ""} ordered</span>
              </div>
            )}

            {result.totalAmount > 0 && (
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>Total paid</span>
                <span className="font-black text-lg" style={{ color: "var(--color-text-primary)" }}>
                  ₹{result.totalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery tracking */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>Delivery Tracking</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>
                Est. {deliveryDate}
              </span>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="relative">
              {/* Track line */}
              <div
                className="absolute left-4 top-4 bottom-4 w-0.5"
                style={{ background: "var(--color-border)" }}
              />
              <div
                className="absolute left-4 top-4 w-0.5"
                style={{ background: "var(--color-accent-green)", height: "40%" }}
              />

              <div className="space-y-5 relative">
                {deliverySteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div
                        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: step.done ? "rgba(34,197,94,0.15)" : "var(--color-bg-elevated)",
                          border: `2px solid ${step.done ? "var(--color-accent-green)" : "var(--color-border)"}`,
                        }}
                      >
                        <Icon
                          size={15}
                          style={{ color: step.done ? "var(--color-accent-green)" : "var(--color-text-muted)" }}
                        />
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: step.done ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                      >
                        {step.label}
                      </span>
                      {step.done && idx === 1 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
                          style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/marketplace")}
            className="flex-1 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
          >
            Continue Shopping <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate("/return")}
            className="flex-1 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            Returns
          </button>
        </div>

      </div>
    </div>
  );
}
