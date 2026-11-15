import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { Avatar, Barra, Caricamento, ChipData, Statistica, Vuoto } from "../../components/Elementi";
import Icona from "../../components/Icona";
import type { Slot, Utente, VoceAgenda } from "../../types";
import { formattaData, formattaOra, giorniDaOggi, messaggioErrore, quando } from "../../utils";
import Benvenuto from "./Benvenuto";

export default function HomeMedico({ utente }: { utente: Utente }) {
  const [visite, setVisite] = useState<VoceAgenda[] | null>(null);
  const [slot, setSlot] = useState<Slot[]>([]);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let annullato = false;
    Promise.all([api.agenda(), api.mieiSlot()])
      .then(([elencoVisite, elencoSlot]) => {
        if (annullato) return;
        setVisite(elencoVisite);
        setSlot(elencoSlot);
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err));
      });
    return () => {
      annullato = true;
    };
  }, []);

  // L'agenda contiene solo visite future (da adesso in poi), già ordinate
  const elenco = visite ?? [];
  const oggi = elenco.filter((v) => giorniDaOggi(v.inizio) === 0);
  const settimana = elenco.filter((v) => giorniDaOggi(v.inizio) < 7);
  const liberi = slot.filter((s) => s.stato === "libero").length;
  const occupati = slot.length - liberi;
  const occupazione = slot.length > 0 ? Math.round((occupati / slot.length) * 100) : 0;
  const prossima = elenco[0];

  return (
    <>
      <Benvenuto utente={utente}>
        <Link className="pulsante grande" to="/agenda">
          <Icona nome="calendario" dimensione={18} />
          Apri l'agenda
        </Link>
      </Benvenuto>

      {errore && <p className="errore">{errore}</p>}
      {visite === null && !errore && <Caricamento />}

      {visite !== null && (
        <>
          <div className="statistiche">
            <Statistica icona="utenti" valore={oggi.length} etichetta="Visite oggi" dettaglio="ancora da svolgere" />
            <Statistica
              icona="calendario"
              tono="viola"
              valore={settimana.length}
              etichetta="Prossimi 7 giorni"
            />
            <Statistica
              icona="orologio"
              tono="verde"
              valore={liberi}
              etichetta="Slot liberi"
              dettaglio="ancora prenotabili"
            />
            <Statistica
              icona="grafico"
              tono="ambra"
              valore={`${occupazione}%`}
              etichetta="Agenda occupata"
              dettaglio={`${occupati} su ${slot.length} slot`}
            />
          </div>

          <div className="griglia-due">
            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="utente" dimensione={18} /> Prossimo paziente
                </h3>
              </div>
              {prossima ? (
                <div className="evidenza">
                  <ChipData iso={prossima.inizio} />
                  <div>
                    <div className="evidenza-titolo">
                      {prossima.paziente_cognome} {prossima.paziente_nome}
                    </div>
                    <div className="evidenza-testo">
                      {formattaData(prossima.inizio)}, ore {formattaOra(prossima.inizio)}
                    </div>
                    {prossima.motivo && (
                      <div className="evidenza-testo">Motivo: {prossima.motivo}</div>
                    )}
                    <span className="conto-rovescia">{quando(prossima.inizio)}</span>
                  </div>
                </div>
              ) : (
                <Vuoto icona="utente">Nessuna visita in programma.</Vuoto>
              )}
              {slot.length > 0 && (
                <div className="sezione">
                  <div className="occupazione-testa">
                    <span className="riga-testo">Occupazione delle disponibilità</span>
                    <span className="occupazione-numeri">{occupazione}%</span>
                  </div>
                  <Barra valore={occupati} totale={slot.length} />
                </div>
              )}
            </div>

            <div className="scheda">
              <div className="titolo-scheda">
                <h3>
                  <Icona nome="orologio" dimensione={18} /> Oggi
                </h3>
                <Link to="/agenda">Agenda completa →</Link>
              </div>
              {oggi.length === 0 && <Vuoto icona="spunta">Nessun'altra visita per oggi.</Vuoto>}
              {oggi.map((v) => (
                <div className="riga" key={v.prenotazione_id}>
                  <div className="riga-principale">
                    <Avatar nome={v.paziente_nome} cognome={v.paziente_cognome} />
                    <div>
                      <div className="riga-titolo">
                        {v.paziente_cognome} {v.paziente_nome}
                      </div>
                      {v.motivo && <div className="nota">{v.motivo}</div>}
                    </div>
                  </div>
                  <span className="orario">
                    <Icona nome="orologio" dimensione={15} />
                    {formattaOra(v.inizio)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
