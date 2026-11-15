import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Avatar, Caricamento, ChipData, Statistica, Vuoto } from "../../components/Elementi";
import Icona from "../../components/Icona";
import type { Prenotazione, Utente } from "../../types";
import { formattaData, formattaDataBreve, formattaOra, messaggioErrore, quando } from "../../utils";
import Benvenuto from "./Benvenuto";

export default function HomePaziente({ utente }: { utente: Utente }) {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

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

  const adesso = new Date();
  const elenco = prenotazioni ?? [];
  const confermate = elenco.filter((p) => p.stato === "confermata");
  const future = confermate
    .filter((p) => new Date(p.slot.inizio) > adesso)
    .sort((a, b) => a.slot.inizio.localeCompare(b.slot.inizio));
  const effettuate = confermate.length - future.length;
  const disdette = elenco.filter((p) => p.stato === "annullata").length;
  const prossima = future[0];

  return (
    <>
      <Benvenuto utente={utente}>
        <Link className="pulsante grande" to="/prenota">
          <Icona nome="piu" dimensione={18} />
          Prenota una visita
        </Link>
      </Benvenuto>

      {errore && <p className="errore">{errore}</p>}
      {prenotazioni === null && !errore && <Caricamento />}

      {prenotazioni !== null && (
        <>
          <div className="statistiche">
            <Statistica
              icona="calendario"
              valore={future.length}
              etichetta="Visite in programma"
            />
            <Statistica
              icona="orologio"
              tono="viola"
              valore={prossima ? quando(prossima.slot.inizio) : "—"}
              etichetta="Prossima visita"
              dettaglio={prossima ? formattaDataBreve(prossima.slot.inizio) : "Nessuna in programma"}
            />
            <Statistica icona="spunta" tono="verde" valore={effettuate} etichetta="Visite effettuate" />
            <Statistica icona="croce" tono="ambra" valore={disdette} etichetta="Visite disdette" />
          </div>

          <div className="griglia-due">
            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="stetoscopio" dimensione={18} /> La tua prossima visita
                </h3>
              </div>
              {prossima ? (
                <div className="evidenza">
                  <ChipData iso={prossima.slot.inizio} />
                  <div>
                    <div className="evidenza-titolo">
                      {prossima.slot.medico.specialita.nome}
                    </div>
                    <div className="evidenza-testo">
                      {formattaData(prossima.slot.inizio)}, ore {formattaOra(prossima.slot.inizio)}
                    </div>
                    <div className="evidenza-testo">
                      {prossima.slot.medico.nome} {prossima.slot.medico.cognome}
                    </div>
                    <span className="conto-rovescia">{quando(prossima.slot.inizio)}</span>
                  </div>
                </div>
              ) : (
                <Vuoto icona="calendario">
                  Non hai visite in programma.
                  <br />
                  <Link to="/prenota">Prenota ora</Link>
                </Vuoto>
              )}
            </div>

            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="elenco" dimensione={18} /> In programma
                </h3>
                <Link to="/prenotazioni">Vedi tutte →</Link>
              </div>
              {future.length === 0 && <Vuoto icona="elenco">Nessuna visita in programma.</Vuoto>}
              {future.slice(0, 4).map((p) => (
                <div className="riga" key={p.id}>
                  <div className="riga-principale">
                    <Avatar nome={p.slot.medico.nome} cognome={p.slot.medico.cognome} />
                    <div>
                      <div className="riga-titolo">{p.slot.medico.specialita.nome}</div>
                      <div className="riga-testo">
                        {formattaDataBreve(p.slot.inizio)} · {formattaOra(p.slot.inizio)}
                      </div>
                      <div className="nota">
                        {p.slot.medico.cognome} {p.slot.medico.nome}
                      </div>
                    </div>
                  </div>
                  <span className="nota">{quando(p.slot.inizio)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
