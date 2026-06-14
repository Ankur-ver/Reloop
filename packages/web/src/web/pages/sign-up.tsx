import { useState } from "react";
import { useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authClient.signUp.email(
        { name, email, password },
        { onSuccess: captureToken }
      );
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--color-bg-secondary)",
    border: "1.5px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
            >
              R
            </div>
            <span className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Re<span style={{ color: "var(--color-accent-green)" }}>Loop</span>
            </span>
          </a>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--color-text-primary)" }}>
            Join ReLoop
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Start turning returns into impact — earn Green Credits today
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border"
          style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
        >
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ankur Verma"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent-green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ankur@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent-green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent-green)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "#2d1515", color: "#f87171", border: "1px solid #4b1c1c" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-opacity"
              style={{
                background: "var(--color-accent-green)",
                color: "#0A0F1E",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Already have an account?{" "}
              <a href="/sign-in" className="font-semibold" style={{ color: "var(--color-accent-green)" }}>
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {["🔒 Secure", "🌱 Free", "♻️ Sustainable"].map((item) => (
            <span key={item} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
