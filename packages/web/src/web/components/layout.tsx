import { Link, useLocation } from "wouter";
import {
  Leaf, LayoutDashboard, ShoppingBag, ArrowLeftRight,
  Users, Coins, RefreshCcw, Menu, X, Zap, LogOut, LogIn, ShoppingCart
} from "lucide-react";
import { useState } from "react";
import { authClient, clearToken } from "../lib/auth";
import { useCart } from "./cart-context";

const navItems = [
  { path: "/", label: "Home", icon: Leaf },
  { path: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { path: "/p2p", label: "P2P Resale", icon: Users },
  { path: "/prevent", label: "Return Shield", icon: Zap },
];

const authNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/return", label: "Submit Return", icon: RefreshCcw },
  { path: "/credits", label: "Green Credits", icon: Coins },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { count: cartCount, openCart } = useCart();

  const isAuthPage = location === "/sign-in" || location === "/sign-up";

  async function handleSignOut() {
    await authClient.signOut();
    clearToken();
    window.location.href = "/";
  }

  const allNavItems = session ? [...navItems, ...authNavItems] : navItems;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg-primary)" }}>
      {/* Top Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: "rgba(10, 15, 30, 0.92)", backdropFilter: "blur(12px)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-accent-green)" }}
            >
              <Leaf size={16} color="#0A0F1E" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
              Re<span style={{ color: "var(--color-accent-green)" }}>Loop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {allNavItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} to={path}>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      color: isActive ? "var(--color-accent-green)" : "var(--color-text-secondary)",
                      background: isActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cart icon */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              title="Cart"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            {session ? (
              <>
                <Link to="/credits">
                  <div
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer"
                    style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--color-accent-green)" }}
                  >
                    <Coins size={14} />
                    <span>Credits</span>
                  </div>
                </Link>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
                  title={session.user.name}
                >
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <button
                  onClick={handleSignOut}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in">
                  <button
                    className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <LogIn size={14} />
                    Sign In
                  </button>
                </Link>
                <Link to="/sign-up">
                  <button
                    className="hidden md:flex items-center px-4 py-1.5 rounded-lg text-sm font-bold"
                    style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
                  >
                    Get Started
                  </button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-1"
            style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
          >
            {allNavItems.map(({ path, label, icon: Icon }) => {
              const isActive = path === "/" ? location === "/" : location.startsWith(path);
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
                    style={{
                      color: isActive ? "var(--color-accent-green)" : "var(--color-text-secondary)",
                      background: isActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </div>
                </Link>
              );
            })}
            {session ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/sign-in" onClick={() => setMobileOpen(false)} className="flex-1">
                  <button className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}>
                    Sign In
                  </button>
                </Link>
                <Link to="/sign-up" onClick={() => setMobileOpen(false)} className="flex-1">
                  <button className="w-full px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-16 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-10 mt-auto"
        style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
      >
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--color-accent-green)" }}>
                <Leaf size={12} color="#0A0F1E" />
              </div>
              <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>
                Re<span style={{ color: "var(--color-accent-green)" }}>Loop</span>
              </span>
            </div>
            <div className="flex gap-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <a href="/marketplace" className="hover:text-white transition-colors">Marketplace</a>
              <a href="/p2p" className="hover:text-white transition-colors">P2P Resale</a>
              <a href="/prevent" className="hover:text-white transition-colors">Return Shield</a>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              © 2025 ReLoop — Amazon Sustainable Commerce
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
