import { ErroreApi } from "./api/client";

export function messaggioErrore(err: unknown): string {
  return err instanceof ErroreApi ? err.message : "Impossibile contattare il server";
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
function due(n: number): string {
  return String(n).padStart(2, "0");
}

// Data e ora locali senza fuso orario, come le salva il back-end
export function isoLocale(d: Date): string {
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}T${due(d.getHours())}:${due(d.getMinutes())}:00`;
}