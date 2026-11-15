import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ErroreApi } from "../api/client";
import { Avatar, IntestazionePagina, Vuoto } from "../components/Elementi";
import Icona from "../components/Icona";
import type { Medico, Slot, Specialita } from "../types";
import { formattaData, formattaOra, messaggioErrore, oggi, perGiorno, quando } from "../utils";

const PASSI = ["Specialità", "Medico", "Orario", "Conferma"];

export default function PrenotaPage() {
  const navigate = useNavigate();
  const [specialita, setSpecialita] = useState<Specialita[]>([]);
  const [medici, setMedici] = useState<Medico[]>([]);
  const [slot, setSlot] = useState<Slot[] | null>(null);
  const [specialitaId, setSpecialitaId] = useState<number | null>(null);
  const [medicoId, setMedicoId] = useState<number | null>(null);
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

  async function caricaSlot(id: number, giorno: string) {
    setSlot(null);
    try {
      setSlot(await api.slotLiberi(id, giorno || undefined));
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function scegliSpecialita(id: number) {
    setSpecialitaId(id);
    setMedicoId(null);
    setMedici([]);
    setSlot(null);
    setSlotScelto(null);
    setErrore(null);
    try {
      setMedici(await api.medici(id));
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  async function scegliMedico(id: number) {
    setMedicoId(id);
    setSlotScelto(null);
    setErrore(null);
    await caricaSlot(id, data);
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

  const medicoScelto = medici.find((m) => m.id === medicoId);
  const passoAttuale = slotScelto ? 3 : medicoId ? 2 : specialitaId ? 1 : 0;

  return (
    <>
      <IntestazionePagina
        titolo="Prenota una visita"
        sottotitolo="Scegli la specialità, il medico e l'orario che preferisci."
      />

      <ol className="passi">
        {PASSI.map((nome, i) => (
          <li key={nome} className={i === passoAttuale ? "attivo" : i < passoAttuale ? "fatto" : ""}>
            <span>{i < passoAttuale ? <Icona nome="spunta" dimensione={14} /> : i + 1}</span>
            {nome}
          </li>
        ))}
      </ol>

      {errore && <p className="errore">{errore}</p>}

      <div className="scheda">
        <h3>1. Specialità</h3>
        <div className="scelte">
          {specialita.map((s) => (
            <button
              key={s.id}
              className={s.id === specialitaId ? "scelta selezionata" : "scelta"}
              onClick={() => void scegliSpecialita(s.id)}
            >
              <span className="scelta-icona">
                <Icona nome="stetoscopio" dimensione={18} />
              </span>
              {s.nome}
            </button>
          ))}
        </div>
      </div>

      {specialitaId && (
        <div className="scheda">
          <h3>2. Medico</h3>
          {medici.length === 0 ? (
            <Vuoto icona="utente">Nessun medico disponibile per questa specialità.</Vuoto>
          ) : (
            <div className="scelte">
              {medici.map((m) => (
                <button
                  key={m.id}
                  className={m.id === medicoId ? "scelta selezionata" : "scelta"}
                  onClick={() => void scegliMedico(m.id)}
                >
                  <Avatar nome={m.nome} cognome={m.cognome} />
                  <span>
                    {m.cognome} {m.nome}
                    <small>{m.specialita.nome}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {medicoId && (
        <div className="scheda">
          <div className="titolo-scheda">
            <h3>3. Orario</h3>
          </div>
          <div className="filtri">
            <label>
              Filtra per giorno (facoltativo)
              <input
                type="date"
                min={oggi()}
                value={data}
                onChange={(e) => void cambiaData(e.target.value)}
              />
            </label>
          </div>
          {slot === null && <p className="nota">Caricamento delle disponibilità…</p>}
          {slot?.length === 0 && (
            <Vuoto icona="calendario">Nessuna disponibilità per i criteri scelti.</Vuoto>
          )}
          {Object.entries(perGiorno(slot ?? [])).map(([giorno, elenco]) => (
            <div key={giorno} className="giorno">
              <h4>
                {formattaData(`${giorno}T00:00:00`)} · {quando(`${giorno}T00:00:00`)}
              </h4>
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
              <h3>
                <Icona nome="spunta" /> 4. Riepilogo
              </h3>
              <div className="riga-principale">
                <Avatar nome={medicoScelto.nome} cognome={medicoScelto.cognome} grande />
                <div>
                  <div className="riga-titolo">
                    {medicoScelto.cognome} {medicoScelto.nome} · {medicoScelto.specialita.nome}
                  </div>
                  <div className="riga-testo">
                    {formattaData(slotScelto.inizio)}, dalle {formattaOra(slotScelto.inizio)} alle{" "}
                    {formattaOra(slotScelto.fine)}
                  </div>
                </div>
              </div>
              <label>
                Motivo della visita (facoltativo)
                <input
                  type="text"
                  maxLength={500}
                  value={motivo}
                  placeholder="Es. controllo periodico"
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </label>
              <button className="grande" onClick={() => void conferma()} disabled={invio}>
                {invio ? "Prenotazione in corso…" : "Conferma prenotazione"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
