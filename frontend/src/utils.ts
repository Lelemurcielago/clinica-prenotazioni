import { ErroreApi } from "./api/client";

export function messaggioErrore(err: unknown): string {
  return err instanceof ErroreApi ? err.message : "Impossibile contattare il server";
}

// Stesso controllo di formato del back-end (lettere ammesse per l'omocodia)
const CIFRA = "[0-9LMNPQRSTUV]";
const FORMATO_CODICE_FISCALE = new RegExp(
  `^[A-Z]{6}${CIFRA}{2}[ABCDEHLMPRST]${CIFRA}{2}[A-Z]${CIFRA}{3}[A-Z]$`,
);

export function codiceFiscaleValido(codice: string): boolean {
  return FORMATO_CODICE_FISCALE.test(codice);
}

export function oggi(): string {
  const d = new Date();
  const mese = String(d.getMonth() + 1).padStart(2, "0");
  const giorno = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mese}-${giorno}`;
}

export function formattaOra(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function formattaData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formattaDataBreve(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const MS_GIORNO = 24 * 60 * 60 * 1000;

function mezzanotte(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Distanza in giorni di calendario da oggi: 0 = oggi, 1 = domani, -1 = ieri
export function giorniDaOggi(iso: string): number {
  return Math.round((mezzanotte(new Date(iso)) - mezzanotte(new Date())) / MS_GIORNO);
}

// "oggi", "domani", "tra 5 giorni"…
export function quando(iso: string): string {
  const giorni = giorniDaOggi(iso);
  if (giorni === 0) return "oggi";
  if (giorni === 1) return "domani";
  if (giorni > 1) return `tra ${giorni} giorni`;
  if (giorni === -1) return "ieri";
  return `${-giorni} giorni fa`;
}

export function iniziali(nome: string, cognome: string): string {
  return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
}

export function saluto(): string {
  const ora = new Date().getHours();
  if (ora < 13) return "Buongiorno";
  if (ora < 18) return "Buon pomeriggio";
  return "Buonasera";
}

// Raggruppa per giorno (AAAA-MM-GG) elementi che hanno un orario di inizio
export function perGiorno<T extends { inizio: string }>(elementi: T[]): Record<string, T[]> {
  return elementi.reduce<Record<string, T[]>>((acc, elemento) => {
    (acc[elemento.inizio.slice(0, 10)] ||= []).push(elemento);
    return acc;
  }, {});
}

function due(n: number): string {
  return String(n).padStart(2, "0");
}

// Data e ora locali senza fuso orario, come le salva il back-end
export function isoLocale(d: Date): string {
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}T${due(d.getHours())}:${due(d.getMinutes())}:00`;
}