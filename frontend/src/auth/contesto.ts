import { createContext, useContext } from "react";
import type { Utente } from "../types";

export interface ContestoAuth {
  utente: Utente | null;
  caricamento: boolean;
  sessioneScaduta: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<ContestoAuth | null>(null);

export function useAuth(): ContestoAuth {
  const contesto = useContext(AuthContext);
  if (!contesto) {
    throw new Error("useAuth va usato dentro AuthProvider");
  }
  return contesto;
}