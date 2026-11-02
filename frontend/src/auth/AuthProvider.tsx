import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, leggiToken, rimuoviToken, salvaToken } from "../api/client";
import type { Utente } from "../types";
import { AuthContext } from "./contesto";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [caricamento, setCaricamento] = useState<boolean>(() => leggiToken() !== null);

  // All'avvio, se c'è un token salvato, recupera il profilo
  useEffect(() => {
    if (!leggiToken()) return;
    api
      .profilo()
      .then(setUtente)
      .catch(() => rimuoviToken())
      .finally(() => setCaricamento(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login(email, password);
    salvaToken(access_token);
    setUtente(await api.profilo());
  }, []);

  const logout = useCallback(() => {
    rimuoviToken();
    setUtente(null);
  }, []);

  const valore = useMemo(
    () => ({ utente, caricamento, login, logout }),
    [utente, caricamento, login, logout],
  );

  return <AuthContext.Provider value={valore}>{children}</AuthContext.Provider>;
}