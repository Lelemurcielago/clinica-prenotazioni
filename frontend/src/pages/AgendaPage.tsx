import { useEffect, useState } from "react";
import { api } from "../api/client";
import NuovoSlotForm from "../components/NuovoSlotForm";
import type { VoceAgenda } from "../types";
import { formattaData, formattaOra, messaggioErrore, oggi } from "../utils";

export default function AgendaPage() {
  const [data, setData] = useState("");
  const [voci, setVoci] = useState<VoceAgenda[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    api
      .agenda()
      .then((elenco) => {
        if (!annullato) setVoci(elenco);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  async function cambiaData(valore: string) {
    setData(valore);
    setErrore(null);
    try {
      setVoci(await api.agenda(valore || undefined));
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  const perGiorno = (voci ?? []).reduce<Record<string, VoceAgenda[]>>((acc, v) => {
    const giorno = v.inizio.slice(0, 10);
    (acc[giorno] ||= []).push(v);
    return acc;
  }, {});

  return (
    <>
      <div className="scheda">
        <h2>La mia agenda</h2>
        <div className="filtri">
          <label>
            Data (facoltativa)
            <input
              type="date"
              min={oggi()}
              value={data}
              onChange={(e) => void cambiaData(e.target.value)}
            />
          </label>
        </div>
        {errore && <p className="errore">{errore}</p>}
        {voci === null && !errore && <p>Caricamento…</p>}
        {voci?.length === 0 && <p>Nessuna visita in programma.</p>}
        {Object.entries(perGiorno).map(([giorno, elenco]) => (
          <div key={giorno} className="giorno">
            <h4>{formattaData(`${giorno}T00:00:00`)}</h4>
            {elenco.map((v) => (
              <div className="riga" key={v.prenotazione_id}>
                <div>
                  <strong>
                    {formattaOra(v.inizio)} - {formattaOra(v.fine)}
                  </strong>
                  <div>
                    {v.paziente_cognome} {v.paziente_nome}
                  </div>
                  {v.motivo && <div className="nota">Motivo: {v.motivo}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="scheda">
        <h2>Aggiungi disponibilità</h2>
        <NuovoSlotForm />
      </div>
    </>
  );
}