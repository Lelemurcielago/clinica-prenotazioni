import type { Prenotazione } from "../types";
import { formattaOra, quando } from "../utils";
import { ChipData } from "./Elementi";
import Icona from "./Icona";

interface Props {
  prenotazione: Prenotazione;
  mostraPaziente?: boolean; // per la segreteria
  onDisdici?: (p: Prenotazione) => void;
}

export default function RigaPrenotazione({ prenotazione: p, mostraPaziente, onDisdici }: Props) {
  const futura = new Date(p.slot.inizio) > new Date();
  const medico = `${p.slot.medico.cognome} ${p.slot.medico.nome}`;

  return (
    <div className={`riga ${p.stato}`}>
      <div className="riga-principale">
        <ChipData iso={p.slot.inizio} />
        <div>
          <div className="riga-titolo">
            {mostraPaziente ? `${p.paziente_cognome} ${p.paziente_nome}` : p.slot.medico.specialita.nome}
          </div>
          <div className="riga-testo">
            <span className="orario">
              <Icona nome="orologio" dimensione={14} />
              {formattaOra(p.slot.inizio)}
            </span>{" "}
            · {mostraPaziente ? `${medico} (${p.slot.medico.specialita.nome})` : medico}
            {futura && p.stato === "confermata" && ` · ${quando(p.slot.inizio)}`}
          </div>
          {p.motivo && <div className="nota">Motivo: {p.motivo}</div>}
        </div>
      </div>
      <div className="azioni">
        <span className={`badge ${p.stato}`}>{p.stato}</span>
        {onDisdici && p.stato === "confermata" && futura && (
          <button className="pericolo" onClick={() => onDisdici(p)}>
            Disdici
          </button>
        )}
      </div>
    </div>
  );
}
