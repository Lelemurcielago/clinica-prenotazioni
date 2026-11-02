import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/contesto";
import type { Ruolo } from "../types";

export default function RottaProtetta({ ruoli }: { ruoli?: Ruolo[] }) {
  const { utente, caricamento } = useAuth();

  if (caricamento) return <p style={{ padding: "1rem" }}>Caricamento…</p>;
  if (!utente) return <Navigate to="/login" replace />;
  if (ruoli && !ruoli.includes(utente.ruolo)) return <Navigate to="/" replace />;
  return <Outlet />;
}