import { useState } from "react";
import { api } from "../api/client";
import type { Medico } from "../types";
import { isoLocale, messaggioErrore, oggi } from "../utils";

interface Props {
  medici?: Medico[]; // solo per la segreteria
  onCreato?: () => void;
}

export default function NuovoSlotForm({ medici, onCreato }: Props) {
  const [medicoId, setMedicoId] = useState("");
  const [data, setData] = useState("");
  const [ora, setOra] = useState("09:00");
  const [durata, setDurata] = useState("30");
  const [errore, setErrore] = useState<string | null>(null);
  const [esito, setEsito] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  async function gestisciInvio(e: { preventDefault: () => void }) {
    e.preventDefault();
    setErrore(null);
    setEsito(null);

    if (medici && !medicoId) {
      setErrore("Seleziona un medico");
      return;
    }
    const inizio = new Date(`${data}T${ora}:00`);
    if (inizio <= new Date()) {
      setErrore("L’orario deve essere nel futuro");
      return;
    }
    const fine = new Date(inizio.getTime() + Number(durata) * 60000);

    setInvio(true);
    try {
      await api.creaSlot({
        medico_id: medici ? Number(medicoId) : undefined,
        inizio: isoLocale(inizio),
        fine: isoLocale(fine),
      });
      setEsito("Disponibilità aggiunta");
      onCreato?.();
    } catch (err) {
      setErrore(messaggioErrore(err));
    } finally {
      setInvio(false);
    }
  }

  return (
    <form onSubmit={gestisciInvio}>
      <div className="filtri">
        {medici && (
          <label>
            Medico
            <select value={medicoId} onChange={(e) => setMedicoId(e.target.value)}>
              <option value="">Seleziona…</option>
              {medici.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.cognome} {m.nome} ({m.specialita.nome})
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Data
          <input type="date" min={oggi()} value={data} required onChange={(e) => setData(e.target.value)} />
        </label>
        <label>
          Ora di inizio
          <input type="time" value={ora} required onChange={(e) => setOra(e.target.value)} />
        </label>
        <label>
          Durata
          <select value={durata} onChange={(e) => setDurata(e.target.value)}>
            <option value="20">20 minuti</option>
            <option value="30">30 minuti</option>
            <option value="45">45 minuti</option>
            <option value="60">60 minuti</option>
          </select>
        </label>
      </div>
      {errore && <p className="errore">{errore}</p>}
      {esito && <p className="esito">{esito}</p>}
      <button type="submit" disabled={invio}>
        {invio ? "Salvataggio…" : "Aggiungi disponibilità"}
      </button>
    </form>
  );
}