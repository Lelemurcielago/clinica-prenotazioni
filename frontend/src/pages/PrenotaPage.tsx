import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ErroreApi } from "../api/client";
import type { Medico, Slot, Specialita } from "../types";
import { formattaData, formattaOra, messaggioErrore, oggi } from "../utils";

export default function PrenotaPage() {
  const navigate = useNavigate();
  const [specialita, setSpecialita] = useState<Specialita[]>([]);
  const [medici, setMedici] = useState<Medico[]>([]);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [specialitaId, setSpecialitaId] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [data, setData] = useState("");
  const [slotScelto, setSlotScelto] = useState<Slot | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    let annullato = false;
    api
      .specialita()
      .then((elenco) => {
        if (!annullato) setSpecialita(elenco);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  async function caricaSlot(id: string, giorno: string) {
    try {
      setSlot(await api.slotLiberi(Number(id), giorno || undefined));
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function scegliSpecialita(valore: string) {
    setSpecialitaId(valore);
    setMedicoId("");
    setMedici([]);
    setSlot([]);
    setSlotScelto(null);
    setErrore(null);
    if (!valore) return;
    try {
      setMedici(await api.medici(Number(valore)));
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function scegliMedico(valore: string) {
    setMedicoId(valore);
    setSlot([]);
    setSlotScelto(null);
    setErrore(null);
    if (valore) await caricaSlot(valore, data);
  }

  async function cambiaData(valore: string) {
    setData(valore);
    setSlotScelto(null);
    setErrore(null);
    if (medicoId) await caricaSlot(medicoId, valore);
  }

  async function conferma() {
    if (!slotScelto) return;
    setInvio(true);
    setErrore(null);
    try {
      await api.prenota(slotScelto.id, motivo.trim() || null);
      navigate("/prenotazioni");
    } catch (err) {
      setErrore(messaggioErrore(err));
      // Se lo slot è stato preso da un altro paziente, aggiorna l'elenco
      if (err instanceof ErroreApi && err.status === 409 && medicoId) {
        setSlotScelto(null);
        await caricaSlot(medicoId, data);
      }
    } finally {
      setInvio(false);
    }
  }

  const medicoScelto = medici.find((m) => String(m.id) === medicoId);

  const perGiorno = slot.reduce<Record<string, Slot[]>>((acc, s) => {
    const giorno = s.inizio.slice(0, 10);
    (acc[giorno] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="scheda">
      <h2>Prenota una visita</h2>

      <div className="filtri">
        <label>
          Specialità
          <select value={specialitaId} onChange={(e) => void scegliSpecialita(e.target.value)}>
            <option value="">Seleziona…</option>
            {specialita.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Medico
          <select
            value={medicoId}
            disabled={!specialitaId}
            onChange={(e) => void scegliMedico(e.target.value)}
          >
            <option value="">Seleziona…</option>
            {medici.map((m) => (
              <option key={m.id} value={m.id}>
                {m.cognome} {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data (facoltativa)
          <input
            type="date"
            min={oggi()}
            value={data}
            disabled={!medicoId}
            onChange={(e) => void cambiaData(e.target.value)}
          />
        </label>
      </div>

      {errore && <p className="errore">{errore}</p>}
      {medicoId && slot.length === 0 && <p>Nessuna disponibilità per i criteri scelti.</p>}

      {Object.entries(perGiorno).map(([giorno, elenco]) => (
        <div key={giorno} className="giorno">
          <h4>{formattaData(`${giorno}T00:00:00`)}</h4>
          <div className="griglia-slot">
            {elenco.map((s) => (
              <button
                key={s.id}
                className={s.id === slotScelto?.id ? "slot scelto" : "slot"}
                onClick={() => setSlotScelto(s)}
              >
                {formattaOra(s.inizio)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {slotScelto && medicoScelto && (
        <div className="conferma">
          <h3>Riepilogo</h3>
          <p>
            {formattaData(slotScelto.inizio)} alle {formattaOra(slotScelto.inizio)} con{" "}
            {medicoScelto.cognome} {medicoScelto.nome} ({medicoScelto.specialita.nome})
          </p>
          <label>
            Motivo della visita (facoltativo)
            <input
              type="text"
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
          <button onClick={() => void conferma()} disabled={invio}>
            {invio ? "Prenotazione in corso…" : "Conferma prenotazione"}
          </button>
        </div>
      )}
    </div>
  );
}