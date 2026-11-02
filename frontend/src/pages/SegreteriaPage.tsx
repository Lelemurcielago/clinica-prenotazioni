import { useEffect, useState } from "react";
import { api } from "../api/client";
import NuovoSlotForm from "../components/NuovoSlotForm";
import type { Medico, Prenotazione } from "../types";
import { formattaData, formattaOra, messaggioErrore } from "../utils";

export default function SegreteriaPage() {
  const [medici, setMedici] = useState<Medico[]>([]);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[] | null>(null);
  const [mostraAnnullate, setMostraAnnullate] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    Promise.all([api.medici(), api.tuttePrenotazioni()])
      .then(([elencoMedici, elencoPrenotazioni]) => {
        if (annullato) return;
        setMedici(elencoMedici);
        setPrenotazioni(elencoPrenotazioni);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  async function disdici(p: Prenotazione) {
    if (!window.confirm("Vuoi disdire questa prenotazione?")) return;
    setErrore(null);
    try {
      await api.disdici(p.id);
      setPrenotazioni(await api.tuttePrenotazioni());
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  const adesso = new Date();
  const visibili = (prenotazioni ?? [])
    .filter((p) => new Date(p.slot.inizio) > adesso)
    .filter((p) => mostraAnnullate || p.stato === "confermata")
    .sort((a, b) => a.slot.inizio.localeCompare(b.slot.inizio));

  return (
    <>
      <div className="scheda">
        <h2>Prenotazioni in programma</h2>
        <label className="casella">
          <input
            type="checkbox"
            checked={mostraAnnullate}
            onChange={(e) => setMostraAnnullate(e.target.checked)}
          />
          Mostra anche le annullate
        </label>
        {errore && <p className="errore">{errore}</p>}
        {prenotazioni === null && !errore && <p>Caricamento…</p>}
        {prenotazioni !== null && visibili.length === 0 && <p>Nessuna prenotazione da mostrare.</p>}
        {visibili.map((p) => (
          <div className="riga" key={p.id}>
            <div>
              <strong>
                {formattaData(p.slot.inizio)}, ore {formattaOra(p.slot.inizio)}
              </strong>
              <div>
                Paziente: {p.paziente_cognome} {p.paziente_nome}
              </div>
              <div>
                {p.slot.medico.cognome} {p.slot.medico.nome} · {p.slot.medico.specialita.nome}
              </div>
              {p.motivo && <div className="nota">Motivo: {p.motivo}</div>}
            </div>
            <div className="azioni">
              <span className={`badge ${p.stato}`}>{p.stato}</span>
              {p.stato === "confermata" && (
                <button className="pericolo" onClick={() => void disdici(p)}>
                  Disdici
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="scheda">
        <h2>Aggiungi disponibilità per un medico</h2>
        <NuovoSlotForm medici={medici} />
      </div>
    </>
  );
}