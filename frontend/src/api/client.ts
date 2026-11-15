import type {
  Medico,
  Prenotazione,
  RegistrazioneDati,
  Slot,
  Specialita,
  Utente,
  VoceAgenda,
} from "../types";

// Indirizzo dell'API: configurabile con VITE_API_URL nel file .env
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const CHIAVE_TOKEN = "salus_token";

export class ErroreApi extends Error {
  status: number;

  constructor(status: number, messaggio: string) {
    super(messaggio);
    this.status = status;
  }
}

export function leggiToken(): string | null {
  return localStorage.getItem(CHIAVE_TOKEN);
}

export function salvaToken(token: string): void {
  localStorage.setItem(CHIAVE_TOKEN, token);
}

export function rimuoviToken(): void {
  localStorage.removeItem(CHIAVE_TOKEN);
}

// Funzione chiamata quando il server rifiuta il token (scaduto o non valido)
let gestoreTokenRifiutato: (() => void) | null = null;

export function impostaGestoreTokenRifiutato(gestore: (() => void) | null): void {
  gestoreTokenRifiutato = gestore;
}

async function richiesta<T>(percorso: string, opzioni: RequestInit = {}): Promise<T> {
  const headers = new Headers(opzioni.headers);
  headers.set("Content-Type", "application/json");
  const token = leggiToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const risposta = await fetch(`${BASE_URL}${percorso}`, { ...opzioni, headers });

  if (risposta.status === 401 && token && percorso !== "/auth/login") {
    rimuoviToken();
    gestoreTokenRifiutato?.();
  }

  if (!risposta.ok) {
    let messaggio = "Errore imprevisto";
    try {
      const corpo = await risposta.json();
      if (typeof corpo.detail === "string") {
        messaggio = corpo.detail;
      } else if (Array.isArray(corpo.detail)) {
        messaggio = "Dati non validi: controlla i campi inseriti";
      }
    } catch {
      // risposta senza corpo JSON: si usa il messaggio generico
    }
    throw new ErroreApi(risposta.status, messaggio);
  }

  return risposta.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    richiesta<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  registra: (dati: RegistrazioneDati) =>
    richiesta<Utente>("/auth/register", {
      method: "POST",
      body: JSON.stringify(dati),
    }),

  profilo: () => richiesta<Utente>("/auth/me"),

  specialita: () => richiesta<Specialita[]>("/specialita"),

  medici: (specialitaId?: number) =>
    richiesta<Medico[]>(specialitaId ? `/medici?specialita_id=${specialitaId}` : "/medici"),

  slotLiberi: (medicoId: number, data?: string) =>
    richiesta<Slot[]>(`/medici/${medicoId}/slot${data ? `?data=${data}` : ""}`),

  prenota: (slotId: number, motivo: string | null) =>
    richiesta<Prenotazione>("/prenotazioni", {
      method: "POST",
      body: JSON.stringify({ slot_id: slotId, motivo }),
    }),

  // Il paziente riceve le proprie prenotazioni, la segreteria tutte
  prenotazioni: () => richiesta<Prenotazione[]>("/prenotazioni"),

  disdici: (prenotazioneId: number) =>
    richiesta<Prenotazione>(`/prenotazioni/${prenotazioneId}`, { method: "DELETE" }),

  agenda: (data?: string) =>
    richiesta<VoceAgenda[]>(`/medici/me/agenda${data ? `?data=${data}` : ""}`),

  mieiSlot: (data?: string) =>
    richiesta<Slot[]>(`/medici/me/slot${data ? `?data=${data}` : ""}`),

  creaSlot: (dati: { medico_id?: number; inizio: string; fine: string }) =>
    richiesta<Slot>("/slot", { method: "POST", body: JSON.stringify(dati) }),

  eliminaSlot: (slotId: number) => richiesta<Slot>(`/slot/${slotId}`, { method: "DELETE" }),
};