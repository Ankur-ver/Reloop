import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Zap, AlertTriangle, CheckCircle, ShoppingBag, ArrowRight, Loader, TrendingDown,
  Lightbulb, RefreshCcw, Shield, Target, Star, MessageCircle, Send, ChevronDown,
  ChevronUp, ThumbsUp, ThumbsDown, Package, Leaf, BarChart2, Activity, Info,
  CheckSquare, Square, DollarSign, User, BookOpen, Cpu
} from "lucide-react";

const categories = ["electronics", "clothing", "footwear", "furniture", "appliances", "books", "sports"];

function GaugeArc({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210;
  const endAngle = 30;
  const totalDeg = 240;
  const scoreDeg = (score / 100) * totalDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const describeArc = (start: number, end: number) => {
    const s = toRad(start), e = toRad(end);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const la = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={size} height={size} className="block">
      <path d={describeArc(startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} strokeLinecap="round" />
      <path d={describeArc(startAngle, startAngle + scoreDeg)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="800" fontFamily="JetBrains Mono">
        {score}
      </text>
      <text x={cx} y={cy + size * 0.19} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={size * 0.09}>
        / 100
      </text>
    </svg>
  );
}

function ProgressBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children, defaultOpen = true }:
  { title: string; icon: any; iconColor: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: iconColor }} />
          <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{title}</span>
        </div>
        {open ? <ChevronUp size={15} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--color-text-muted)" }} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function AIAssistant({ context, category, brand }: { context: string; category: string; brand: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: `Hi! I've analyzed this ${brand} ${category} purchase. Ask me anything — risks, alternatives, what reviewers say, or if it suits your needs.` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQuestions = ["Why is risk high?", "What are common complaints?", "Suggest alternatives", "Is this good value?"];

  const askQuestion = async (q: string) => {
    const question = q || input.trim();
    if (!question) return;
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.prevent.chat.$post({ json: { question, context } });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: (data as any).answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, couldn't reach the AI right now. Try again." }]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
  };

  return (
    <div>
      <div ref={scrollRef} className="space-y-3 max-h-56 overflow-y-auto mb-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-xs leading-relaxed`}
              style={{
                background: m.role === "user" ? "#3B82F6" : "var(--color-bg-elevated)",
                color: m.role === "user" ? "#fff" : "var(--color-text-secondary)",
                borderBottomRightRadius: m.role === "user" ? 4 : undefined,
                borderBottomLeftRadius: m.role === "ai" ? 4 : undefined,
              }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl" style={{ background: "var(--color-bg-elevated)" }}>
              <Loader size={14} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {quickQuestions.map(q => (
          <button key={q} onClick={() => askQuestion(q)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askQuestion("")}
          placeholder="Ask anything about this purchase..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
        <button onClick={() => askQuestion("")} className="p-2.5 rounded-xl"
          style={{ background: "#3B82F6", color: "#fff" }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

export default function PreventPage() {
  const [form, setForm] = useState({
    category: "", brand: "", price: "", productName: "",
    userQuery: "", budget: "", intendedUse: "", experienceLevel: ""
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [comparisonList, setComparisonList] = useState<any[]>([]);

  const { data: statsData } = useQuery({
    queryKey: ["prevent-stats"],
    queryFn: async () => {
      const res = await api.prevent.stats.$get();
      return res.json() as Promise<{
        totalAnalyses: number; moneySavedINR: number; co2SavedKg: number;
        returnsCnt: number; productsCnt: number; p2pCnt: number;
      }>;
    },
  });

  const formatMoney = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  const analyzeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.prevent.analyze.$post({
        json: { ...data, price: parseFloat(data.price) || 0, budget: data.budget ? parseFloat(data.budget) : undefined }
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setCheckedItems(new Set());
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.brand) return;
    analyzeMutation.mutate(form);
  };

  const r = result?.result;

  // Dynamic scores adjusted by checklist
  const adjustedRisk = r ? Math.max(0, r.riskScore - Array.from(checkedItems).reduce((acc, idx) => acc + (r.preventionChecklist[idx]?.riskReductionPoints || 0), 0)) : 0;
  const adjustedConfidence = r ? Math.min(100, r.confidenceScore + Array.from(checkedItems).reduce((acc, idx) => acc + Math.floor((r.preventionChecklist[idx]?.riskReductionPoints || 0) * 0.6), 0)) : 0;

  const riskColor = adjustedRisk >= 60 ? "#EF4444" : adjustedRisk >= 40 ? "#F59E0B" : "#22C55E";
  const confidenceColor = adjustedConfidence >= 70 ? "#22C55E" : adjustedConfidence >= 50 ? "#F59E0B" : "#EF4444";
  const fitColor = r ? (r.fitScore >= 70 ? "#3B82F6" : r.fitScore >= 50 ? "#F59E0B" : "#EF4444") : "#3B82F6";

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const addToComparison = () => {
    if (!r || comparisonList.length >= 3) return;
    const exists = comparisonList.some(c => c.brand === form.brand && c.category === form.category);
    if (exists) return;
    setComparisonList(prev => [...prev, {
      name: form.productName || `${form.brand} ${form.category}`,
      brand: form.brand,
      category: form.category,
      riskScore: adjustedRisk,
      confidenceScore: adjustedConfidence,
      fitScore: r.fitScore,
    }]);
  };

  const getBestLabel = (list: typeof comparisonList) => {
    if (list.length < 2) return {};
    const labels: Record<number, string> = {};
    const minRisk = Math.min(...list.map(c => c.riskScore));
    const maxConf = Math.max(...list.map(c => c.confidenceScore));
    const maxFit = Math.max(...list.map(c => c.fitScore));
    list.forEach((c, i) => {
      if (c.riskScore === minRisk) labels[i] = "Lowest Risk";
      if (c.confidenceScore === maxConf) labels[i] = "Best Overall";
      if (c.fitScore === maxFit && !labels[i]) labels[i] = "Best Fit";
    });
    return labels;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)" }}>
          <Shield size={26} style={{ color: "#EF4444" }} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
          AI PURCHASE INTELLIGENCE
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>Return Shield</h1>
        <p className="text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
          Deep AI analysis — return risk, purchase confidence, fit score, review intelligence, and explainable insights.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Money Saved on Platform", value: statsData ? formatMoney(statsData.moneySavedINR) : "—", color: "#22C55E" },
          { label: "CO₂ Saved (kg)", value: statsData ? `${statsData.co2SavedKg.toFixed(1)} kg` : "—", color: "#F59E0B" },
          { label: "AI Analyses Done", value: statsData ? String(statsData.totalAnalyses) : "—", color: "#3B82F6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-2xl text-center"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div className="text-2xl font-bold mb-1" style={{ color, fontFamily: "JetBrains Mono" }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {!r && (
        <form onSubmit={handleSubmit} className="space-y-5 mb-6">
          <div className="p-6 rounded-2xl space-y-4"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Tell us what you're about to buy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Category *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Brand *</label>
                <input type="text" required placeholder="e.g. Nike, Sony, IKEA" value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Product Name</label>
                <input type="text" placeholder="e.g. Nike Air Max 270" value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Price (₹)</label>
                <input type="number" placeholder="e.g. 15000" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Any specific concern? (Optional)</label>
              <input type="text" placeholder="e.g. buying as a gift, not sure about size..."
                value={form.userQuery} onChange={(e) => setForm({ ...form, userQuery: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            {/* Advanced prefs toggle */}
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "#3B82F6" }}>
              <User size={14} />
              {showAdvanced ? "Hide" : "Add"} personalization preferences
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Your Budget (₹)</label>
                  <input type="number" placeholder="Max budget" value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Intended Use</label>
                  <input type="text" placeholder="e.g. gaming, office, gym" value={form.intendedUse}
                    onChange={(e) => setForm({ ...form, intendedUse: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Experience Level</label>
                  <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}>
                    <option value="">Select</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={analyzeMutation.isPending}
            className="w-full py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#EF4444", color: "#fff" }}>
            {analyzeMutation.isPending ? (
              <><Loader size={18} className="animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Zap size={18} /> Analyze Purchase</>
            )}
          </button>
        </form>
      )}

      {/* ─── RESULTS DASHBOARD ─── */}
      {r && (
        <div className="space-y-4">
          {/* Top Summary: 3 Gauges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Return Risk", score: adjustedRisk, color: riskColor, subtitle: adjustedRisk >= 60 ? "High Risk" : adjustedRisk >= 40 ? "Medium Risk" : "Low Risk" },
              { label: "Confidence", score: adjustedConfidence, color: confidenceColor, subtitle: adjustedConfidence >= 70 ? "Buy with confidence" : adjustedConfidence >= 50 ? "Some caution" : "High caution" },
              { label: "Fit Score", score: r.fitScore, color: fitColor, subtitle: r.fitScore >= 70 ? "Great fit" : r.fitScore >= 50 ? "Decent fit" : "Poor fit" },
            ].map(({ label, score, color, subtitle }) => (
              <div key={label} className="flex flex-col items-center p-3 md:p-4 rounded-2xl"
                style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
                <GaugeArc score={score} color={color} size={100} />
                <div className="text-xs font-bold mt-2 text-center" style={{ color: "var(--color-text-primary)" }}>{label}</div>
                <div className="text-xs mt-0.5 text-center" style={{ color }}>{subtitle}</div>
              </div>
            ))}
          </div>

          {/* Checklist notice if items checked */}
          {checkedItems.size > 0 && (
            <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}>
              <CheckCircle size={15} />
              <span>{checkedItems.size} checklist item{checkedItems.size > 1 ? "s" : ""} completed — scores updated dynamically</span>
            </div>
          )}

          {/* Explainable AI: Risk Drivers + Positive Signals */}
          <SectionCard title="Explainable AI — Risk Analysis" icon={Activity} iconColor="#EF4444">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#EF4444" }}>
                  <AlertTriangle size={12} /> RISK DRIVERS
                </div>
                <ul className="space-y-2">
                  {(r.riskDrivers || []).map((d: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.06)", color: "var(--color-text-secondary)" }}>
                      <AlertTriangle size={12} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#22C55E" }}>
                  <CheckCircle size={12} /> POSITIVE SIGNALS
                </div>
                <ul className="space-y-2">
                  {(r.positiveSignals || []).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-xl"
                      style={{ background: "rgba(34,197,94,0.06)", color: "var(--color-text-secondary)" }}>
                      <CheckCircle size={12} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* Purchase Confidence Detail */}
          <SectionCard title="Purchase Confidence Breakdown" icon={Shield} iconColor="#3B82F6">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Confidence Score</span>
                <span className="text-lg font-bold" style={{ color: confidenceColor, fontFamily: "JetBrains Mono" }}>{adjustedConfidence}%</span>
              </div>
              <ProgressBar value={adjustedConfidence} color={confidenceColor} height={8} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#3B82F6" }}>WHY CONFIDENT</div>
                  <ul className="space-y-1.5">
                    {(r.confidenceReasons || []).map((cr: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
                        <ThumbsUp size={11} style={{ color: "#3B82F6", flexShrink: 0, marginTop: 3 }} />
                        {cr}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#F59E0B" }}>AREAS OF CONCERN</div>
                  <ul className="space-y-1.5">
                    {(r.areasOfConcern || []).map((ac: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
                        <Info size={11} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 3 }} />
                        {ac}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Product Fit Score */}
          <SectionCard title="Product Fit Score" icon={Target} iconColor="#8B5CF6">
            <div className="flex items-center gap-6 mb-4">
              <GaugeArc score={r.fitScore} color={fitColor} size={90} />
              <div className="flex-1">
                <div className="text-2xl font-bold mb-1" style={{ color: fitColor, fontFamily: "JetBrains Mono" }}>
                  {r.fitScore}/100
                </div>
                <div className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                  {r.fitScore >= 80 ? "Excellent match for your needs" : r.fitScore >= 60 ? "Good fit with minor caveats" : "May not fully meet your expectations"}
                </div>
                <ProgressBar value={r.fitScore} color={fitColor} height={6} />
              </div>
            </div>
            <ul className="space-y-2">
              {(r.fitReasons || []).map((fr: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {fr.startsWith("⚠") || fr.toLowerCase().includes("slightly") || fr.toLowerCase().includes("above") ?
                    <AlertTriangle size={12} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} /> :
                    <CheckCircle size={12} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />}
                  {fr.replace(/^[✓⚠]\s*/, "")}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Review Intelligence */}
          <SectionCard title="AI Review Intelligence" icon={Star} iconColor="#F59E0B">
            {r.reviewInsights && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive themes */}
                  <div>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "#22C55E" }}>
                      <ThumbsUp size={11} /> POSITIVE THEMES
                    </div>
                    <div className="space-y-2">
                      {(r.reviewInsights.positiveThemes || []).map((t: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.theme}</span>
                            <span className="text-xs font-mono" style={{ color: "#22C55E" }}>{t.count} mentions</span>
                          </div>
                          <ProgressBar value={Math.min(100, t.count / 2)} color="#22C55E" height={4} />
                          {t.examples?.[0] && (
                            <div className="text-xs mt-1 italic" style={{ color: "var(--color-text-muted)" }}>"{t.examples[0]}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Negative themes */}
                  <div>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "#EF4444" }}>
                      <ThumbsDown size={11} /> NEGATIVE THEMES
                    </div>
                    <div className="space-y-2">
                      {(r.reviewInsights.negativeThemes || []).map((t: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.theme}</span>
                            <span className="text-xs font-mono" style={{ color: "#EF4444" }}>{t.count} mentions</span>
                          </div>
                          <ProgressBar value={Math.min(100, t.count / 2)} color="#EF4444" height={4} />
                          {t.examples?.[0] && (
                            <div className="text-xs mt-1 italic" style={{ color: "var(--color-text-muted)" }}>"{t.examples[0]}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top return reasons */}
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>TOP RETURN REASONS</div>
                  <div className="space-y-2">
                    {(r.reviewInsights.topReturnReasons || []).map((tr: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="text-sm flex-1" style={{ color: "var(--color-text-secondary)" }}>{tr.reason}</div>
                        <div className="w-24">
                          <ProgressBar value={tr.percentage} color={i === 0 ? "#EF4444" : i === 1 ? "#F59E0B" : "#8B5CF6"} height={5} />
                        </div>
                        <div className="text-xs font-mono w-8 text-right" style={{ color: "var(--color-text-muted)" }}>{tr.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Personalized Risk */}
          {r.personalizedRisk && (
            <SectionCard title="Personalized Risk Prediction" icon={User} iconColor="#3B82F6">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Generic Risk</div>
                  <div className="text-2xl font-bold" style={{ color: "#F59E0B", fontFamily: "JetBrains Mono" }}>{r.personalizedRisk.genericRisk}%</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Your Risk</div>
                  <div className="text-2xl font-bold" style={{
                    color: r.personalizedRisk.userRisk > r.personalizedRisk.genericRisk ? "#EF4444" : "#22C55E",
                    fontFamily: "JetBrains Mono"
                  }}>{r.personalizedRisk.userRisk}%</div>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{r.personalizedRisk.differenceExplanation}</p>
            </SectionCard>
          )}

          {/* Prevention Checklist */}
          <SectionCard title="AI Prevention Checklist" icon={CheckSquare} iconColor="#22C55E">
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              Check items as you verify them — risk decreases and confidence increases dynamically.
            </p>
            <div className="space-y-2">
              {(r.preventionChecklist || []).map((item: any, i: number) => {
                const checked = checkedItems.has(i);
                return (
                  <button key={i} onClick={() => toggleCheck(i)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-90"
                    style={{
                      background: checked ? "rgba(34,197,94,0.08)" : "var(--color-bg-elevated)",
                      border: `1px solid ${checked ? "rgba(34,197,94,0.3)" : "transparent"}`
                    }}>
                    {checked ?
                      <CheckSquare size={16} style={{ color: "#22C55E", flexShrink: 0 }} /> :
                      <Square size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
                    <span className="flex-1 text-sm" style={{
                      color: checked ? "#22C55E" : "var(--color-text-secondary)",
                      textDecoration: checked ? "line-through" : "none"
                    }}>{item.item}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                      -{item.riskReductionPoints}%
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Return Cost Impact */}
          {r.returnCostImpact && (
            <SectionCard title="Return Cost Impact" icon={Leaf} iconColor="#22C55E">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Shipping Cost", value: `₹${r.returnCostImpact.shippingCostINR}`, color: "#EF4444" },
                  { label: "Processing Cost", value: `₹${r.returnCostImpact.processingCostINR}`, color: "#F59E0B" },
                  { label: "Total Est. Cost", value: `₹${r.returnCostImpact.totalCostINR}`, color: "#EF4444" },
                  { label: "CO₂ Emitted", value: `${r.returnCostImpact.co2KgEmitted} kg`, color: "#22C55E" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: "var(--color-bg-elevated)" }}>
                    <div className="text-lg font-bold mb-1" style={{ color, fontFamily: "JetBrains Mono" }}>{value}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                Estimated environmental and financial impact if this purchase is returned. Avoid unnecessary returns to save the planet.
              </p>
            </SectionCard>
          )}

          {/* AI Shopping Assistant */}
          <SectionCard title="AI Shopping Assistant" icon={MessageCircle} iconColor="#3B82F6">
            <AIAssistant context={r.assistantContext || ""} category={form.category} brand={form.brand} />
          </SectionCard>

          {/* Recommendations */}
          {r.recommendations?.length > 0 && (
            <SectionCard title="AI Recommendations" icon={Lightbulb} iconColor="#F59E0B">
              <ul className="space-y-2">
                {r.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <CheckCircle size={13} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Alternatives */}
          {r.alternatives?.length > 0 && (
            <SectionCard title="Smarter Alternatives" icon={ShoppingBag} iconColor="var(--color-accent-green)">
              <div className="space-y-3">
                {r.alternatives.map((alt: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "var(--color-bg-elevated)" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{alt.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{alt.reason}</div>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-bold ml-3 shrink-0"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                      -{alt.savingsPercent}%
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Product Comparison */}
          {comparisonList.length > 0 && (
            <SectionCard title="Product Comparison" icon={BarChart2} iconColor="#8B5CF6">
              {(() => {
                const labels = getBestLabel(comparisonList);
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          {["Product", "Return Risk", "Fit Score", "Confidence"].map(h => (
                            <th key={h} className="text-left py-2 px-2 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonList.map((c, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <td className="py-2.5 px-2">
                              <div className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>{c.name}</div>
                              {labels[i] && (
                                <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                                  style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}>{labels[i]}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold"
                              style={{ color: c.riskScore >= 60 ? "#EF4444" : c.riskScore >= 40 ? "#F59E0B" : "#22C55E" }}>
                              {c.riskScore}%
                            </td>
                            <td className="py-2.5 px-2 font-mono font-bold"
                              style={{ color: c.fitScore >= 70 ? "#3B82F6" : "#F59E0B" }}>{c.fitScore}/100</td>
                            <td className="py-2.5 px-2 font-mono font-bold"
                              style={{ color: c.confidenceScore >= 70 ? "#22C55E" : "#F59E0B" }}>
                              {c.confidenceScore}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </SectionCard>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={addToComparison} disabled={comparisonList.length >= 3}
              className="flex-1 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
              <BarChart2 size={14} /> Add to Compare {comparisonList.length > 0 && `(${comparisonList.length}/3)`}
            </button>
            <button onClick={() => { setResult(null); analyzeMutation.reset(); setCheckedItems(new Set()); }}
              className="flex-1 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
              <RefreshCcw size={14} /> Analyze Another
            </button>
            <a href="/marketplace" className="flex-1">
              <button className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                Browse Refurbished <ArrowRight size={14} />
              </button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
