import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to fallback based on current role if not allowed
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "buyer") return <Redirect to="/buyer" />;
    if (user.role === "farmer") return <Redirect to="/farmer" />;
    return <Redirect to="/" />;
  }

  return <Component />;
}
