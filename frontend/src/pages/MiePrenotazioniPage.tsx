import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Caricamento, IntestazionePagina, Vuoto } from "../components/Elementi";
import Icona from "../components/Icona";
import RigaPrenotazione from "../components/RigaPrenotazione";
import type { Prenotazione } from "../types";
import { messaggioErrore } from "../utils";

type Vista = "programma" | "storico";

export default function MiePrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("programma");

  useEffect(() => {
    let annullato = false;
    api
      .prenotazioni()
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
      setPrenotazioni(await api.prenotazioni());
    } catch (err) {
      setErrore(messaggioErrore(err));
    }
  }

  // In programma: confermate e future, dalla più vicina. Storico: tutto il resto, dalla più recente
  const adesso = new Date();
  const elenco = prenotazioni ?? [];
  const inProgramma = elenco
    .filter((p) => p.stato === "confermata" && new Date(p.slot.inizio) > adesso)
    .sort((a, b) => a.slot.inizio.localeCompare(b.slot.inizio));
  const storico = elenco
    .filter((p) => !inProgramma.includes(p))
    .sort((a, b) => b.slot.inizio.localeCompare(a.slot.inizio));
  const visibili = vista === "programma" ? inProgramma : storico;

  return (
    <>
      <IntestazionePagina
        titolo="Le mie prenotazioni"
        sottotitolo="Le tue visite in programma e lo storico delle precedenti."
        azioni={
          <Link className="pulsante" to="/prenota">
            <Icona nome="piu" dimensione={17} />
            Nuova prenotazione
          </Link>
        }
      />

      <div className="scheda">
        <div className="titolo-scheda">
          <div className="tab" role="tablist">
            <button
              role="tab"
              aria-selected={vista === "programma"}
              className={vista === "programma" ? "attivo" : ""}
              onClick={() => setVista("programma")}
            >
              In programma ({inProgramma.length})
            </button>
            <button
              role="tab"
              aria-selected={vista === "storico"}
              className={vista === "storico" ? "attivo" : ""}
              onClick={() => setVista("storico")}
            >
              Storico ({storico.length})
            </button>
          </div>
        </div>

        {errore && <p className="errore">{errore}</p>}
        {prenotazioni === null && !errore && <Caricamento />}
        {prenotazioni !== null && visibili.length === 0 && (
          <Vuoto icona="calendario">
            {vista === "programma" ? (
              <>
                Non hai visite in programma. <Link to="/prenota">Prenota una visita</Link>
              </>
            ) : (
              "Nessuna visita nello storico."
            )}
          </Vuoto>
        )}
        {visibili.map((p) => (
          <RigaPrenotazione key={p.id} prenotazione={p} onDisdici={(x) => void disdici(x)} />
        ))}
      </div>
    </>
  );
}
