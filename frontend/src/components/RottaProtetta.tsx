import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/contesto";

export default function RottaProtetta() {
  const { utente, caricamento } = useAuth();

  if (caricamento) return <p style={{ padding: "1rem" }}>Caricamento…</p>;
  if (!utente) return <Navigate to="/login" replace />;
  return <Outlet />;
}