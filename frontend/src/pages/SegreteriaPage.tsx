import { useEffect, useState } from "react";
import { api } from "../api/client";
import ElencoDisponibilita from "../components/ElencoDisponibilita";
import { Caricamento, IntestazionePagina, Vuoto } from "../components/Elementi";
import Icona from "../components/Icona";
import NuovoSlotForm from "../components/NuovoSlotForm";
import RigaPrenotazione from "../components/RigaPrenotazione";
import type { Medico, Prenotazione, Slot } from "../types";
import { formattaData, formattaOra, messaggioErrore, perGiorno, quando } from "../utils";

export default function SegreteriaPage() {
  const [medici, setMedici] = useState<Medico[]>([]);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[] | null>(null);
  const [mostraAnnullate, setMostraAnnullate] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [filtroMedico, setFiltroMedico] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [medicoSlot, setMedicoSlot] = useState("");
  const [slotLiberi, setSlotLiberi] = useState<Slot[] | null>(null);
  const [erroreSlot, setErroreSlot] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    Promise.all([api.medici(), api.prenotazioni()])
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
      setPrenotazioni(await api.prenotazioni());
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function caricaSlot(medicoId: string) {
    setErroreSlot(null);
    if (!medicoId) {
      setSlotLiberi(null);
      return;
    }
    try {
      setSlotLiberi(await api.slotLiberi(Number(medicoId)));
    } catch (err) {
      setErroreSlot(messaggioErrore(err));
    }
  }

  async function scegliMedico(valore: string) {
    setMedicoSlot(valore);
    await caricaSlot(valore);
  }

  async function eliminaSlot(s: Slot) {
    if (!window.confirm(`Eliminare la disponibilità delle ${formattaOra(s.inizio)}?`)) return;
    setErroreSlot(null);
    try {
      await api.eliminaSlot(s.id);
      await caricaSlot(medicoSlot);
    } catch (err) {
      setErroreSlot(messaggioErrore(err));
    }
  }

  const adesso = new Date();
  const testo = ricerca.trim().toLowerCase();
  const visibili = (prenotazioni ?? [])
    .filter((p) => new Date(p.slot.inizio) > adesso)
    .filter((p) => mostraAnnullate || p.stato === "confermata")
    .filter((p) => !filtroMedico || String(p.slot.medico.id) === filtroMedico)
    .filter(
      (p) =>
        !testo ||
        `${p.paziente_nome} ${p.paziente_cognome}`.toLowerCase().includes(testo) ||
        `${p.paziente_cognome} ${p.paziente_nome}`.toLowerCase().includes(testo),
    )
    .sort((a, b) => a.slot.inizio.localeCompare(b.slot.inizio));
  const giorni = perGiorno(visibili.map((p) => ({ ...p, inizio: p.slot.inizio })));

  return (
    <>
      <IntestazionePagina
        titolo="Gestione clinica"
        sottotitolo="Prenotazioni in programma e disponibilità dei medici."
      />

      <div className="scheda">
        <div className="titolo-scheda">
          <h3>
            <Icona nome="calendario" dimensione={18} /> Prenotazioni in programma
          </h3>
          <span className="nota">{visibili.length} risultati</span>
        </div>
        <div className="filtri">
          <label>
            Cerca paziente
            <input
              type="search"
              value={ricerca}
              placeholder="Nome o cognome"
              onChange={(e) => setRicerca(e.target.value)}
            />
          </label>
          <label>
            Medico
            <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)}>
              <option value="">Tutti i medici</option>
              {medici.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.cognome} {m.nome} ({m.specialita.nome})
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="casella">
          <input
            type="checkbox"
            checked={mostraAnnullate}
            onChange={(e) => setMostraAnnullate(e.target.checked)}
          />
          Mostra anche le annullate
        </label>
        {errore && <p className="errore">{errore}</p>}
        {prenotazioni === null && !errore && <Caricamento />}
        {prenotazioni !== null && visibili.length === 0 && (
          <Vuoto icona="elenco">Nessuna prenotazione da mostrare.</Vuoto>
        )}
        {Object.entries(giorni).map(([giorno, elenco]) => (
          <div key={giorno} className="giorno">
            <h4>
              {formattaData(`${giorno}T00:00:00`)} · {quando(`${giorno}T00:00:00`)}
            </h4>
            {elenco.map((p) => (
              <RigaPrenotazione
                key={p.id}
                prenotazione={p}
                mostraPaziente
                onDisdici={(x) => void disdici(x)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="griglia-due sezione">
        <div className="scheda">
          <div className="titolo-scheda">
            <h3>
              <Icona nome="piu" dimensione={18} /> Aggiungi disponibilità
            </h3>
          </div>
          <NuovoSlotForm medici={medici} onCreato={() => void caricaSlot(medicoSlot)} />
        </div>

        <div className="scheda">
          <div className="titolo-scheda">
            <h3>
              <Icona nome="orologio" dimensione={18} /> Disponibilità libere
            </h3>
          </div>
          <div className="filtri">
            <label>
              Medico
              <select value={medicoSlot} onChange={(e) => void scegliMedico(e.target.value)}>
                <option value="">Seleziona…</option>
                {medici.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.cognome} {m.nome} ({m.specialita.nome})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {erroreSlot && <p className="errore">{erroreSlot}</p>}
          {slotLiberi === null && !erroreSlot && (
            <Vuoto icona="stetoscopio">Seleziona un medico per vederne le disponibilità.</Vuoto>
          )}
          {slotLiberi !== null && (
            <ElencoDisponibilita slot={slotLiberi} onElimina={(s) => void eliminaSlot(s)} />
          )}
        </div>
      </div>
    </>
  );
}
