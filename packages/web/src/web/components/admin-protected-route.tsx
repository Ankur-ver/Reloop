import { Redirect } from "wouter";
import { authClient } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const { data: adminCheck, isPending: checkPending } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check", { credentials: "include" });
      return res.json() as Promise<{ isAdmin: boolean; authenticated: boolean; role: string }>;
    },
    enabled: !!session,
    staleTime: 30_000,
  });

  if (sessionPending || (session && checkPending)) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: "var(--color-accent-green)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  if (!session) return <Redirect to="/sign-in" />;

  if (!adminCheck?.isAdmin) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="text-center">
          <div
            className="text-6xl font-black mb-4"
            style={{ color: "#EF4444" }}
          >
            403
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
            You don't have permission to access this page.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: "var(--color-accent-green)", color: "#0A0F1E" }}
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
