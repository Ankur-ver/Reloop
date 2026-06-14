import { Route, Switch, useLocation } from "wouter";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { AdminProtectedRoute } from "./components/admin-protected-route";
import HomePage from "./pages/index";
import DashboardPage from "./pages/dashboard";
import ReturnPage from "./pages/return";
import MarketplacePage from "./pages/marketplace";
import ProductPage from "./pages/product";
import CreditsPage from "./pages/credits";
import P2PPage from "./pages/p2p";
import P2PDonationsPage from "./pages/p2p-donations";
import PreventPage from "./pages/prevent";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import AdminDashboardPage from "./pages/admin/index";
import AdminLRHNPage from "./pages/admin/lrhn";
import AdminReturnsPage from "./pages/admin/returns";
import AdminProductsPage from "./pages/admin/products";
import AdminP2PPage from "./pages/admin/p2p";
import AdminUsersPage from "./pages/admin/users";
import OrderConfirmPage from "./pages/order-confirm";

import { CartDrawer } from "./components/cart-drawer";
import { useEffect } from "react";
import { api } from "./lib/api";

function SeedOnMount() {
  useEffect(() => {
    api.seed.$post().catch(() => {});
  }, []);
  return null;
}

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/lrhn">
        <AdminProtectedRoute><AdminLRHNPage /></AdminProtectedRoute>
      </Route>
      <Route path="/admin/returns">
        <AdminProtectedRoute><AdminReturnsPage /></AdminProtectedRoute>
      </Route>
      <Route path="/admin/products">
        <AdminProtectedRoute><AdminProductsPage /></AdminProtectedRoute>
      </Route>
      <Route path="/admin/p2p">
        <AdminProtectedRoute><AdminP2PPage /></AdminProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>
      </Route>
      <Route path="/admin">
        <AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        <SeedOnMount />
        <AdminRoutes />
        
      </>
    );
  }

  return (
    <>
      <SeedOnMount />
      <Layout>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/sign-in" component={SignInPage} />
          <Route path="/sign-up" component={SignUpPage} />
          <Route path="/marketplace" component={MarketplacePage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/p2p" component={P2PPage} />
          <Route path="/p2p/donations" component={P2PDonationsPage} />
          <Route path="/prevent" component={PreventPage} />
          <Route path="/dashboard">
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </Route>
          <Route path="/return">
            <ProtectedRoute>
              <ReturnPage />
            </ProtectedRoute>
          </Route>
          <Route path="/credits">
            <ProtectedRoute>
              <CreditsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/orders/confirm" component={OrderConfirmPage} />
          <Route>
            <div className="flex items-center justify-center min-h-screen" style={{ color: "var(--color-text-muted)" }}>
              <div className="text-center">
                <div className="text-6xl font-black mb-4" style={{ color: "var(--color-accent-green)" }}>404</div>
                <p>Page not found</p>
                <a href="/" className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}>
                  Go Home
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </Layout>
      <CartDrawer />
      
    </>
  );
}

export default App;
