import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api,
  impostaGestoreTokenRifiutato,
  leggiToken,
  rimuoviToken,
  salvaToken,
} from "../api/client";
import type { Utente } from "../types";
import { AuthContext } from "./contesto";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null);
  const [caricamento, setCaricamento] = useState<boolean>(() => leggiToken() !== null);
  const [sessioneScaduta, setSessioneScaduta] = useState(false);

  // Se il server rifiuta il token l'utente viene disconnesso
  // e le rotte protette lo riportano alla pagina di accesso
  useEffect(() => {
    impostaGestoreTokenRifiutato(() => {
      setUtente(null);
      setSessioneScaduta(true);
    });
    return () => impostaGestoreTokenRifiutato(null);
  }, []);

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
    setSessioneScaduta(false);
    setUtente(await api.profilo());
  }, []);

  const logout = useCallback(() => {
    rimuoviToken();
    setUtente(null);
  }, []);

  const valore = useMemo(
    () => ({ utente, caricamento, sessioneScaduta, login, logout }),
    [utente, caricamento, sessioneScaduta, login, logout],
  );

  return <AuthContext.Provider value={valore}>{children}</AuthContext.Provider>;
}