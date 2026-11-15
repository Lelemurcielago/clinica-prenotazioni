export type Ruolo = "paziente" | "medico" | "segreteria";

export interface Utente {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
}

export interface Specialita {
  id: number;
  nome: string;
}

export interface Medico {
  id: number;
  nome: string;
  cognome: string;
  specialita: Specialita;
}

export interface Slot {
  id: number;
  medico_id: number;
  inizio: string;
  fine: string;
  stato: "libero" | "occupato" | "rimosso";
}

export type StatoPrenotazione = "confermata" | "annullata";

export interface Prenotazione {
  id: number;
  paziente_id: number;
  paziente_nome: string;
  paziente_cognome: string;
  stato: StatoPrenotazione;
  motivo: string | null;
  creata_il: string;
  slot: Slot & { medico: Medico };
}

export interface VoceAgenda {
  prenotazione_id: number;
  inizio: string;
  fine: string;
  motivo: string | null;
  paziente_nome: string;
  paziente_cognome: string;
}

export interface RegistrazioneDati {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  telefono: string | null;
  codice_fiscale: string;
  data_nascita: string;
}