import { Redirect } from "wouter";
import { authClient } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--color-accent-green)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}
