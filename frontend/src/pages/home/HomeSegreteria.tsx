import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Avatar, Barra, Caricamento, Statistica, Vuoto } from "../../components/Elementi";
import Icona from "../../components/Icona";
import type { Medico, Prenotazione, Utente } from "../../types";
import { formattaDataBreve, formattaOra, giorniDaOggi, messaggioErrore } from "../../utils";
import Benvenuto from "./Benvenuto";

interface Dati {
  prenotazioni: Prenotazione[];
  medici: Medico[];
  liberiPerMedico: Record<number, number>;
}

export default function HomeSegreteria({ utente }: { utente: Utente }) {
  const [dati, setDati] = useState<Dati | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    async function carica() {
      const [prenotazioni, medici] = await Promise.all([api.prenotazioni(), api.medici()]);
      // Slot ancora liberi di ogni medico, per calcolare l'occupazione
      const liberi = await Promise.all(medici.map((m) => api.slotLiberi(m.id)));
      const liberiPerMedico = Object.fromEntries(medici.map((m, i) => [m.id, liberi[i].length]));
      return { prenotazioni, medici, liberiPerMedico };
    }
    carica()
      .then((risultato) => {
        if (!annullato) setDati(risultato);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  const adesso = new Date();
  const future = (dati?.prenotazioni ?? [])
    .filter((p) => new Date(p.slot.inizio) > adesso)
    .sort((a, b) => a.slot.inizio.localeCompare(b.slot.inizio));
  const confermate = future.filter((p) => p.stato === "confermata");
  const oggi = confermate.filter((p) => giorniDaOggi(p.slot.inizio) === 0);
  const settimana = confermate.filter((p) => giorniDaOggi(p.slot.inizio) < 7);
  const disdette = future.filter((p) => p.stato === "annullata").length;

  const occupazione = (dati?.medici ?? [])
    .map((m) => {
      const prenotati = confermate.filter((p) => p.slot.medico.id === m.id).length;
      const totale = prenotati + (dati?.liberiPerMedico[m.id] ?? 0);
      return { medico: m, prenotati, totale };
    })
    .sort((a, b) => b.prenotati / (b.totale || 1) - a.prenotati / (a.totale || 1));

  return (
    <>
      <Benvenuto utente={utente}>
        <Link className="pulsante grande" to="/segreteria">
          <Icona nome="elenco" dimensione={18} />
          Gestione clinica
        </Link>
      </Benvenuto>

      {errore && <p className="errore">{errore}</p>}
      {dati === null && !errore && <Caricamento />}

      {dati !== null && (
        <>
          <div className="statistiche">
            <Statistica icona="utenti" valore={oggi.length} etichetta="Visite oggi" dettaglio="ancora da svolgere" />
            <Statistica icona="calendario" tono="viola" valore={settimana.length} etichetta="Prossimi 7 giorni" />
            <Statistica
              icona="spunta"
              tono="verde"
              valore={confermate.length}
              etichetta="Visite in programma"
            />
            <Statistica
              icona="croce"
              tono="ambra"
              valore={disdette}
              etichetta="Disdette"
              dettaglio="su visite non ancora svolte"
            />
          </div>

          <div className="griglia-due">
            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="grafico" dimensione={18} /> Occupazione per medico
                </h3>
              </div>
              {occupazione.length === 0 && <Vuoto icona="stetoscopio">Nessun medico registrato.</Vuoto>}
              {occupazione.map(({ medico, prenotati, totale }) => (
                <div className="occupazione" key={medico.id}>
                  <div className="occupazione-testa">
                    <div className="riga-principale">
                      <Avatar nome={medico.nome} cognome={medico.cognome} />
                      <div>
                        <div className="riga-titolo">
                          {medico.cognome} {medico.nome}
                        </div>
                        <div className="nota">{medico.specialita.nome}</div>
                      </div>
                    </div>
                    <span className="occupazione-numeri">
                      {prenotati} / {totale} slot
                    </span>
                  </div>
                  <Barra valore={prenotati} totale={totale} />
                </div>
              ))}
            </div>

            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="orologio" dimensione={18} /> Prossime visite
                </h3>
                <Link to="/segreteria">Vedi tutte →</Link>
              </div>
              {confermate.length === 0 && <Vuoto icona="calendario">Nessuna visita in programma.</Vuoto>}
              {confermate.slice(0, 6).map((p) => (
                <div className="riga" key={p.id}>
                  <div className="riga-principale">
                    <Avatar nome={p.paziente_nome} cognome={p.paziente_cognome} />
                    <div>
                      <div className="riga-titolo">
                        {p.paziente_cognome} {p.paziente_nome}
                      </div>
                      <div className="nota">
                        {p.slot.medico.specialita.nome} · {p.slot.medico.cognome} {p.slot.medico.nome}
                      </div>
                    </div>
                  </div>
                  <div className="riga-testo">
                    {formattaDataBreve(p.slot.inizio)} · {formattaOra(p.slot.inizio)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
