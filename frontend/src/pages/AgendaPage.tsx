import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import ElencoDisponibilita from "../components/ElencoDisponibilita";
import { Avatar, Caricamento, IntestazionePagina, Vuoto } from "../components/Elementi";
import Icona from "../components/Icona";
import NuovoSlotForm from "../components/NuovoSlotForm";
import type { Slot, VoceAgenda } from "../types";
import { formattaData, formattaOra, messaggioErrore, oggi, perGiorno, quando } from "../utils";

export default function AgendaPage() {
  const [data, setData] = useState("");
  const [voci, setVoci] = useState<VoceAgenda[] | null>(null);
  const [slot, setSlot] = useState<Slot[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  // Visite e disponibilità vengono sempre caricate insieme, con lo stesso filtro per data
  const carica = useCallback(async (giorno: string) => {
    const [elencoVoci, elencoSlot] = await Promise.all([
      api.agenda(giorno || undefined),
      api.mieiSlot(giorno || undefined),
    ]);
    setVoci(elencoVoci);
    setSlot(elencoSlot);
  }, []);

  useEffect(() => {
    let annullato = false;
    Promise.all([api.agenda(), api.mieiSlot()])
      .then(([elencoVoci, elencoSlot]) => {
        if (annullato) return;
        setVoci(elencoVoci);
        setSlot(elencoSlot);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  async function aggiorna(giorno: string) {
    setErrore(null);
    try {
      await carica(giorno);
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function cambiaData(valore: string) {
    setData(valore);
    await aggiorna(valore);
  }

  async function elimina(s: Slot) {
    if (!window.confirm(`Eliminare la disponibilità delle ${formattaOra(s.inizio)}?`)) return;
    setErrore(null);
    try {
      await api.eliminaSlot(s.id);
      await carica(data);
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  return (
    <>
      <IntestazionePagina
        titolo="La mia agenda"
        sottotitolo="Visite prenotate e disponibilità, da oggi in poi o per un giorno preciso."
        azioni={
          <label>
            Giorno
            <input
              type="date"
              min={oggi()}
              value={data}
              onChange={(e) => void cambiaData(e.target.value)}
            />
          </label>
        }
      />

      <div className="scheda">
        <div className="titolo-scheda">
          <h3>
            <Icona nome="utenti" dimensione={18} /> Visite prenotate
          </h3>
          {voci && <span className="nota">{voci.length} visite</span>}
        </div>
        {errore && <p className="errore">{errore}</p>}
        {voci === null && !errore && <Caricamento />}
        {voci?.length === 0 && <Vuoto icona="calendario">Nessuna visita in programma.</Vuoto>}
        {Object.entries(perGiorno(voci ?? [])).map(([giorno, elenco]) => (
          <div key={giorno} className="giorno">
            <h4>
              {formattaData(`${giorno}T00:00:00`)} · {quando(`${giorno}T00:00:00`)}
            </h4>
            {elenco.map((v) => (
              <div className="riga" key={v.prenotazione_id}>
                <div className="riga-principale">
                  <Avatar nome={v.paziente_nome} cognome={v.paziente_cognome} />
                  <div>
                    <div className="riga-titolo">
                      {v.paziente_cognome} {v.paziente_nome}
                    </div>
                    {v.motivo && <div className="nota">Motivo: {v.motivo}</div>}
                  </div>
                </div>
                <span className="orario">
                  <Icona nome="orologio" dimensione={15} />
                  {formattaOra(v.inizio)} - {formattaOra(v.fine)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="griglia-due sezione">
        <div className="scheda">
          <div className="titolo-scheda">
            <h3>
              <Icona nome="orologio" dimensione={18} /> Le mie disponibilità
            </h3>
          </div>
          {slot !== null && <ElencoDisponibilita slot={slot} onElimina={(s) => void elimina(s)} />}
        </div>

        <div className="scheda">
          <div className="titolo-scheda">
            <h3>
              <Icona nome="piu" dimensione={18} /> Aggiungi disponibilità
            </h3>
          </div>
          <NuovoSlotForm onCreato={() => void aggiorna(data)} />
        </div>
      </div>
    </>
  );
}
