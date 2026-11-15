import { useState } from "react";
import type { Slot } from "../types";
import { formattaData, formattaOra, perGiorno, quando } from "../utils";
import { Vuoto } from "./Elementi";
import Icona from "./Icona";

interface Props {
  slot: Slot[];
  onElimina: (slot: Slot) => void;
}

const GIORNI_INIZIALI = 5;

// Disponibilità raggruppate per giorno, in forma compatta; solo gli slot liberi si possono eliminare.
// Per non avere elenchi lunghissimi si mostrano i primi giorni, gli altri a richiesta.
export default function ElencoDisponibilita({ slot, onElimina }: Props) {
  const [tutti, setTutti] = useState(false);

  if (slot.length === 0) {
    return <Vuoto icona="calendario">Nessuna disponibilità per il periodo scelto.</Vuoto>;
  }

  const giorni = Object.entries(perGiorno(slot));
  const visibili = tutti ? giorni : giorni.slice(0, GIORNI_INIZIALI);
  const nascosti = giorni.length - visibili.length;

  return (
    <>
      <div className="legenda">
        <span className="badge libero">libero</span>
        <span className="badge occupato">prenotato</span>
      </div>
      {visibili.map(([giorno, elenco]) => (
        <div key={giorno} className="giorno">
          <h4>
            {formattaData(`${giorno}T00:00:00`)} · {quando(`${giorno}T00:00:00`)}
          </h4>
          <div className="griglia-slot">
            {elenco.map((s) => (
              <span
                key={s.id}
                className={`chip-slot ${s.stato}`}
                title={`${formattaOra(s.inizio)} - ${formattaOra(s.fine)}`}
              >
                {formattaOra(s.inizio)}
                {s.stato === "libero" && (
                  <button
                    className="chip-elimina"
                    aria-label={`Elimina la disponibilità delle ${formattaOra(s.inizio)}`}
                    title="Elimina"
                    onClick={() => onElimina(s)}
                  >
                    <Icona nome="croce" dimensione={13} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
      {(nascosti > 0 || tutti) && giorni.length > GIORNI_INIZIALI && (
        <button className="chiaro mostra-altri" onClick={() => setTutti(!tutti)}>
          {tutti ? "Mostra meno giorni" : `Mostra altri ${nascosti} giorni`}
        </button>
      )}
    </>
  );
}
