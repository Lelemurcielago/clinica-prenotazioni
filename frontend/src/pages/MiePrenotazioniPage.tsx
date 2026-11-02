import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Prenotazione } from "../types";
import { formattaData, formattaOra, messaggioErrore } from "../utils";

export default function MiePrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    api
      .miePrenotazioni()
      .then((elenco) => {
        if (!annullato) setPrenotazioni(elenco);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  async function disdici(p: Prenotazione) {
    if (!window.confirm("Vuoi davvero disdire questa visita?")) return;
    setErrore(null);
    try {
      await api.disdici(p.id);
      setPrenotazioni(await api.miePrenotazioni());
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  return (
    <div className="scheda">
      <h2>Le mie prenotazioni</h2>
      {errore && <p className="errore">{errore}</p>}
      {prenotazioni === null && !errore && <p>Caricamento…</p>}
      {prenotazioni?.length === 0 && (
        <p>
          Non hai ancora prenotazioni. <Link to="/prenota">Prenota una visita</Link>
        </p>
      )}
      {prenotazioni?.map((p) => {
        const futura = new Date(p.slot.inizio) > new Date();
        return (
          <div className="riga" key={p.id}>
            <div>
              <strong>
                {formattaData(p.slot.inizio)}, ore {formattaOra(p.slot.inizio)}
              </strong>
              <div>
                {p.slot.medico.cognome} {p.slot.medico.nome} · {p.slot.medico.specialita.nome}
              </div>
              {p.motivo && <div className="nota">Motivo: {p.motivo}</div>}
            </div>
            <div className="azioni">
              <span className={`badge ${p.stato}`}>{p.stato}</span>
              {p.stato === "confermata" && futura && (
                <button className="pericolo" onClick={() => void disdici(p)}>
                  Disdici
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}