import type { ReactNode } from "react";
import { iniziali } from "../utils";
import Icona, { type NomeIcona } from "./Icona";

// Piccoli elementi grafici riutilizzati in tutte le pagine

export function Avatar({ nome, cognome, grande }: { nome: string; cognome: string; grande?: boolean }) {
  return <span className={grande ? "avatar grande" : "avatar"}>{iniziali(nome, cognome)}</span>;
}

// Data in forma di "foglietto del calendario": mese, giorno e giorno della settimana
export function ChipData({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div className="chip-data" aria-hidden="true">
      <span className="mese">{d.toLocaleDateString("it-IT", { month: "short" })}</span>
      <span className="numero">{d.getDate()}</span>
      <span className="settimana">{d.toLocaleDateString("it-IT", { weekday: "short" })}</span>
    </div>
  );
}

interface PropsStatistica {
  icona: NomeIcona;
  valore: ReactNode;
  etichetta: string;
  dettaglio?: string;
  tono?: "blu" | "verde" | "ambra" | "viola";
}

export function Statistica({ icona, valore, etichetta, dettaglio, tono = "blu" }: PropsStatistica) {
  return (
    <div className={`statistica ${tono}`}>
      <span className="statistica-icona">
        <Icona nome={icona} />
      </span>
      <div>
        <div className="statistica-valore">{valore}</div>
        <div className="statistica-etichetta">{etichetta}</div>
        {dettaglio && <div className="statistica-dettaglio">{dettaglio}</div>}
      </div>
    </div>
  );
}

// Barra di avanzamento con percentuale (es. occupazione dell'agenda)
export function Barra({ valore, totale }: { valore: number; totale: number }) {
  const percentuale = totale > 0 ? Math.round((valore / totale) * 100) : 0;
  return (
    <div className="barra" role="progressbar" aria-valuenow={percentuale} aria-valuemin={0} aria-valuemax={100}>
      <div className="barra-piena" style={{ width: `${percentuale}%` }} />
    </div>
  );
}

export function IntestazionePagina({
  titolo,
  sottotitolo,
  azioni,
}: {
  titolo: string;
  sottotitolo?: string;
  azioni?: ReactNode;
}) {
  return (
    <div className="intestazione-pagina">
      <div>
        <h2>{titolo}</h2>
        {sottotitolo && <p>{sottotitolo}</p>}
      </div>
      {azioni && <div className="azioni">{azioni}</div>}
    </div>
  );
}

export function Vuoto({ icona, children }: { icona: NomeIcona; children: ReactNode }) {
  return (
    <div className="vuoto">
      <span className="vuoto-icona">
        <Icona nome={icona} dimensione={28} />
      </span>
      <div>{children}</div>
    </div>
  );
}

export function Caricamento() {
  return (
    <div className="caricamento" aria-live="polite">
      <span className="rotella" /> Caricamento…
    </div>
  );
}
