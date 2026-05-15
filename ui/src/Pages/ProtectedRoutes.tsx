import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "../store";
import type { ReactNode } from "react";


interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const location = useLocation();

  const redirectTo = `${location.pathname}${location.search}${location.hash}`;

  // on the server, just render children (auth is checked client-side)
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
        state={{ from: redirectTo }}
      />
    );
  }

  return <>{children}</>;
}