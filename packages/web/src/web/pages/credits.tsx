import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";
import { Coins, TrendingUp, ArrowUpRight, ArrowDownRight, Leaf, Recycle, Heart, ShoppingBag, ArrowLeftRight, Gift, Loader } from "lucide-react";
import { Link } from "wouter";

const txTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  return: { icon: ShoppingBag, color: "#22C55E", label: "Return" },
  donate: { icon: Heart, color: "#F59E0B", label: "Donation" },
  recycle: { icon: Recycle, color: "#6B7280", label: "Recycle" },
  exchange: { icon: ArrowLeftRight, color: "#8B5CF6", label: "Exchange" },
  redeem: { icon: Gift, color: "#EF4444", label: "Redeemed" },
};

const redeemOptions = [
  { label: "₹50 Off Next Order", cost: 50, description: "Apply as instant discount" },
  { label: "₹100 Off Next Order", cost: 100, description: "Apply as instant discount" },
  { label: "₹200 Off Next Order", cost: 200, description: "Apply as instant discount" },
  { label: "Free Shipping Voucher", cost: 75, description: "Valid on any order" },
  { label: "Donate to Climate Fund", cost: 100, description: "Contribute to carbon offset projects" },
];

export default function CreditsPage() {
  const qc = useQueryClient();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["credits-balance"],
    queryFn: async () => (await api.credits.balance.$get()).json(),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["credit-transactions"],
    queryFn: async () => (await api.credits.transactions.$get()).json(),
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const res = await api.credits.redeem.$post({ json: { amount, description } });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits-balance"] });
      qc.invalidateQueries({ queryKey: ["credit-transactions"] });
      setRedeeming(null);
    },
  });

  const balance = (balanceData as any)?.balance || 0;
  const user = (balanceData as any)?.user;
  const transactions = (txData as any)?.transactions || [];

  const earned = transactions.filter((t: any) => t.amount > 0).reduce((acc: number, t: any) => acc + t.amount, 0);
  const spent = transactions.filter((t: any) => t.amount < 0).reduce((acc: number, t: any) => acc + Math.abs(t.amount), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
          <Coins size={11} /> GREEN CREDITS WALLET
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Your Green Credits</h1>
        <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
          Earn credits for every eco-friendly action. Redeem for discounts or donate to climate causes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Balance card */}
        <div className="md:col-span-1 p-8 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.3)" }}>
          <Coins size={32} className="mx-auto mb-3" style={{ color: "#F59E0B" }} />
          <div className="text-5xl font-black mb-1" style={{ color: "#F59E0B", fontFamily: "JetBrains Mono" }}>
            {balanceLoading ? "..." : balance}
          </div>
          <div className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Available Green Credits</div>
          <div className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>1 credit ≈ ₹1 discount</div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight size={16} style={{ color: "var(--color-accent-green)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Total Earned</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: "var(--color-accent-green)", fontFamily: "JetBrains Mono" }}>{earned}</div>
          </div>
          <div className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight size={16} style={{ color: "#EF4444" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Total Spent</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: "#EF4444", fontFamily: "JetBrains Mono" }}>{spent}</div>
          </div>
          <div className="p-5 rounded-2xl col-span-2" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={15} style={{ color: "var(--color-accent-green)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Environmental Impact</span>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xl font-bold" style={{ color: "var(--color-accent-green)", fontFamily: "JetBrains Mono" }}>{user?.co2Saved?.toFixed(1) || "0.0"}kg</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>CO₂ prevented</div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: "#3B82F6", fontFamily: "JetBrains Mono" }}>{user?.totalReturns || 0}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Products rerouted</div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: "#F59E0B", fontFamily: "JetBrains Mono" }}>{user?.totalDonations || 0}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Donations made</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Redeem section */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Gift size={16} style={{ color: "var(--color-accent-green)" }} />
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Redeem Credits</span>
          </div>
          <div className="space-y-3">
            {redeemOptions.map((option) => {
              const canAfford = balance >= option.cost;
              return (
                <div key={option.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: canAfford ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{option.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{option.description}</div>
                  </div>
                  <button
                    disabled={!canAfford || redeemMutation.isPending}
                    onClick={() => {
                      setRedeeming(option.label);
                      redeemMutation.mutate({ amount: option.cost, description: option.label });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: canAfford ? "var(--color-accent-green)" : "var(--color-bg-elevated)",
                      color: canAfford ? "#0A0F1E" : "var(--color-text-muted)",
                      opacity: canAfford ? 1 : 0.5,
                      cursor: canAfford ? "pointer" : "not-allowed",
                    }}
                  >
                    {redeemMutation.isPending && redeeming === option.label ? (
                      <Loader size={12} className="animate-spin" />
                    ) : (
                      <Coins size={12} />
                    )}
                    {option.cost}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction history */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} style={{ color: "var(--color-accent-green)" }} />
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Transaction History</span>
          </div>
          {txLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
              <Coins size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions yet. Submit a return to earn credits.</p>
              <Link to="/return">
                <button className="mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                  Submit Return
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => {
                const config = txTypeConfig[tx.type] || txTypeConfig.return;
                const Icon = config.icon;
                const isEarn = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: config.color + "15" }}>
                      <Icon size={14} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{tx.description}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{config.label}</div>
                    </div>
                    <div className={`text-sm font-bold`} style={{ color: isEarn ? "#22C55E" : "#EF4444" }}>
                      {isEarn ? "+" : ""}{tx.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* How to earn more */}
      <div className="mt-6 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
        <h3 className="font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Earn More Green Credits</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { action: "Submit a Return", credits: "35-75", icon: ShoppingBag, color: "#22C55E" },
            { action: "Donate an Item", credits: "75", icon: Heart, color: "#F59E0B" },
            { action: "Recycle an Item", credits: "20", icon: Recycle, color: "#6B7280" },
            { action: "Buy Refurbished", credits: "10-80", icon: Coins, color: "#3B82F6" },
          ].map(({ action, credits, icon: Icon, color }) => (
            <div key={action} className="p-4 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)" }}>
              <Icon size={20} className="mx-auto mb-2" style={{ color }} />
              <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>{action}</div>
              <div className="text-lg font-bold" style={{ color, fontFamily: "JetBrains Mono" }}>+{credits}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
