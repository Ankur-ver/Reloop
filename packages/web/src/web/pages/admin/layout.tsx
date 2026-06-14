import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, RefreshCcw, Users, MapPin,
  ShoppingBag, Leaf, ChevronRight, LogOut, Shield, Menu, X
} from "lucide-react";
import { authClient, clearToken } from "../../lib/auth";
import { useState } from "react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, color: "#22C55E" },
  { path: "/admin/lrhn", label: "LRHN", icon: MapPin, color: "#3B82F6" },
  { path: "/admin/returns", label: "Returns", icon: RefreshCcw, color: "#8B5CF6" },
  { path: "/admin/products", label: "Products", icon: Package, color: "#F59E0B" },
  { path: "/admin/p2p", label: "P2P Listings", icon: ShoppingBag, color: "#06B6D4" },
  { path: "/admin/users", label: "Users", icon: Users, color: "#EF4444" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    clearToken();
    window.location.href = "/";
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-4" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-green)" }}>
            <Leaf size={15} color="#0A0F1E" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Re<span style={{ color: "var(--color-accent-green)" }}>Loop</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Shield size={10} style={{ color: "#EF4444" }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: "#EF4444" }}>ADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon, exact, color }) => {
          const isActive = exact ? location === path : location.startsWith(path);
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden"
                style={{
                  color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                  background: isActive ? `${color}18` : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = isActive ? "#fff" : "rgba(255,255,255,0.75)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = isActive ? "#fff" : "rgba(255,255,255,0.45)";
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: color }} />
                )}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{ background: isActive ? `${color}25` : "transparent" }}>
                  <Icon size={14} style={{ color: isActive ? color : "inherit" }} />
                </div>
                <span className="flex-1 text-sm">{label}</span>
                {isActive && <ChevronRight size={12} style={{ color }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
        <Link to="/">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer mt-0.5 transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <Leaf size={14} />
            <span>Back to App</span>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-primary)" }}>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: "rgba(10,15,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent-green)" }}>
            <Leaf size={13} color="#0A0F1E" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
            Re<span style={{ color: "var(--color-accent-green)" }}>Loop</span>
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ml-1"
            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>ADMIN</div>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg"
          style={{ color: "rgba(255,255,255,0.6)" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 z-50 w-56 flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "rgba(10,15,30,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 flex-col fixed top-0 bottom-0 left-0 z-40"
        style={{ background: "rgba(10,15,30,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="md:ml-56 flex-1 min-h-screen overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
