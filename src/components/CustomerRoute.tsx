import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function CustomerRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="route-status">Checking access…</div>;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  return children;
}

export default CustomerRoute;
