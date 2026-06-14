import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  ArrowRight, Leaf, Zap, Coins, ShoppingBag, Users, RefreshCcw,
  Star, Shield, TrendingUp, Globe, Recycle, Heart, ArrowLeftRight, BarChart3
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

const dispositionRoutes = [
  { icon: ShoppingBag, label: "Resell", desc: "Near-perfect items go straight to ReLoop Certified marketplace", color: "#22C55E", bg: "rgba(34, 197, 94, 0.1)" },
  { icon: Zap, label: "Refurbish", desc: "Cosmetically imperfect items cleaned, fixed, and relisted", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  { icon: Heart, label: "Donate", desc: "Usable items matched with NGO partners for social impact", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  { icon: Recycle, label: "Recycle", desc: "Broken items sent to certified e-waste recycling partners", color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" },
  { icon: ArrowLeftRight, label: "Exchange", desc: "Swap for another product of equal or lesser value", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.1)" },
];

const processSteps = [
  { step: "01", title: "Submit Your Return", desc: "Upload product photos or video. Our AI analyzes quality in seconds.", icon: RefreshCcw },
  { step: "02", title: "AI Grades & Decides", desc: "Computer vision assesses condition, routes to optimal next life.", icon: Zap },
  { step: "03", title: "Earn Green Credits", desc: "Instantly credited for every responsible disposal decision.", icon: Coins },
  { step: "04", title: "Product Lives On", desc: "Your product reaches its next owner — or a better end.", icon: Leaf },
];

function StatCard({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "var(--color-accent-green)", fontFamily: "'JetBrains Mono', monospace" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const metrics = useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => (await api.dashboard["platform-metrics"].$get()).json(),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--color-bg-primary)" }}>
        {/* BG gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #22C55E, transparent)" }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 fade-in-up"
              style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "var(--color-accent-green)" }}>
              <div className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: "var(--color-accent-green)" }} />
              Amazon's Sustainable Commerce Initiative
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 fade-in-up fade-in-up-delay-1">
              Every Product<br />
              <span className="gradient-text">Deserves a</span><br />
              Second Life.
            </h1>

            <p className="text-lg mb-8 fade-in-up fade-in-up-delay-2" style={{ color: "var(--color-text-secondary)", maxWidth: "480px", lineHeight: "1.7" }}>
              ReLoop uses AI to give returned, unused, or discarded products their optimal second life — resell, refurbish, donate, or recycle. Planet. People. Profit.
            </p>

            <div className="flex flex-wrap gap-3 fade-in-up fade-in-up-delay-3">
              <Link to="/return">
                <button className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                  Submit a Return <ArrowRight size={16} />
                </button>
              </Link>
              <Link to="/marketplace">
                <button className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all"
                  style={{ border: "1px solid rgba(34, 197, 94, 0.4)", color: "var(--color-accent-green)", background: "transparent" }}>
                  Shop Refurbished <ShoppingBag size={16} />
                </button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-8 fade-in-up fade-in-up-delay-4">
              {[
                { icon: Shield, label: "AI Certified Quality" },
                { icon: Globe, label: "Carbon Neutral" },
                { icon: Star, label: "Trusted by 2M+ Users" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <Icon size={13} style={{ color: "var(--color-accent-green)" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — floating cards */}
          <div className="relative hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="rounded-2xl p-6 mb-4 card-hover" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>AI Disposition Result</div>
                  <div className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--color-accent-green)" }}>96% confidence</div>
                </div>
                <div className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Sony WH-1000XM5</div>
                <div className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>Returned: "Changed my mind"</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Quality Grade</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--color-accent-green)" }}>Excellent</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Disposition</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--color-accent-blue)" }}>Resell</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                  <div className="flex items-center gap-2">
                    <Coins size={16} style={{ color: "var(--color-accent-green)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--color-accent-green)" }}>+60 Green Credits Earned</span>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--color-accent-green)" }} />
                </div>
              </div>

              {/* Floating stat */}
              <div className="absolute -top-4 -right-4 p-3 rounded-xl shadow-lg" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>CO₂ Saved Today</div>
                <div className="text-xl font-bold" style={{ color: "var(--color-accent-green)", fontFamily: "JetBrains Mono" }}>4.2kg</div>
              </div>
              <div className="absolute -bottom-4 -left-4 p-3 rounded-xl shadow-lg" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Items Rerouted</div>
                <div className="text-xl font-bold" style={{ color: "var(--color-accent-amber)", fontFamily: "JetBrains Mono" }}>1.2M+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y py-12" style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}>
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard target={1200000} suffix="+" label="Products Given Second Life" />
          <StatCard target={4800} suffix="T" label="CO₂ Emissions Prevented" />
          <StatCard target={2000000} suffix="+" label="Green Credits Issued" />
          <StatCard target={94} suffix="%" label="Successful Disposition Rate" />
        </div>
      </section>

      {/* Disposition routes */}
      <section className="py-24 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--color-accent-green)" }}>
              AI DISPOSITION ENGINE
            </div>
            <h2 className="text-4xl font-bold mb-4">Five Paths to a Better Future</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Our AI evaluates every product and routes it to the path that maximizes value — for you, the next owner, and the planet.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {dispositionRoutes.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="card-hover p-6 rounded-2xl flex flex-col gap-4"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <div className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4" style={{ background: "var(--color-bg-secondary)" }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
              HOW IT WORKS
            </div>
            <h2 className="text-4xl font-bold mb-4">From Return to Rebirth in 4 Steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px" style={{ background: "var(--color-border)", top: "2.5rem" }} />
            {processSteps.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className="relative p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.1)" }}>
                    <Icon size={18} style={{ color: "var(--color-accent-green)" }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)", fontFamily: "JetBrains Mono" }}>{step}</span>
                </div>
                <div className="font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>{title}</div>
                <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Complete Circular Commerce Platform</h2>
            <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>Everything you need to close the loop on product waste.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "AI Quality Grading", desc: "Computer vision analyzes product images/video for instant quality scoring with Excellent/Good/Fair/Poor grades.", color: "#22C55E" },
              { icon: Coins, title: "Green Credits Wallet", desc: "Earn credits for every eco-friendly action. Redeem against future purchases or donate to climate funds.", color: "#F59E0B" },
              { icon: Shield, title: "Certified Refurbished", desc: "Amazon-certified refurbishment process with quality guarantee, warranty, and 40% average savings.", color: "#3B82F6" },
              { icon: Users, title: "P2P Resale Network", desc: "List unused items directly on Amazon's trusted marketplace — verified buyers, secure payments.", color: "#8B5CF6" },
              { icon: TrendingUp, title: "Return Prevention AI", desc: "Pre-purchase prediction engine warns about return risks and recommends better alternatives.", color: "#EF4444" },
              { icon: BarChart3, title: "Sustainability Analytics", desc: "Real-time dashboard showing CO₂ saved, products rerouted, and your personal environmental impact.", color: "#22C55E" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card-hover p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>{title}</div>
                <div className="text-sm" style={{ color: "var(--color-text-muted)", lineHeight: "1.6" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="rounded-3xl p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.08))", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(34, 197, 94, 0.2)", color: "var(--color-accent-green)" }}>
                <Globe size={12} /> Certified Carbon Neutral Platform
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Close the Loop.<br />
                <span className="gradient-text">Start Today.</span>
              </h2>
              <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                Join millions of customers making every product count. Submit your first return and earn 50 Green Credits instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/return">
                  <button className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:opacity-90"
                    style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                    Submit Your First Return <ArrowRight size={16} />
                  </button>
                </Link>
                <Link to="/marketplace">
                  <button className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all"
                    style={{ border: "1px solid rgba(34, 197, 94, 0.4)", color: "var(--color-accent-green)" }}>
                    Browse Refurbished <ShoppingBag size={16} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
