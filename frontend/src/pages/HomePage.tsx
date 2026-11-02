import { Link } from "react-router-dom";
import { useAuth } from "../auth/contesto";

export default function HomePage() {
  const { utente } = useAuth();

  return (
    <div className="scheda">
      <h2>
        Benvenuto, {utente?.nome} {utente?.cognome}
      </h2>
      <p>
        Accesso effettuato come <strong>{utente?.ruolo}</strong>.
      </p>
      {utente?.ruolo === "paziente" && (
        <div className="azioni">
          <Link className="pulsante" to="/prenota">
            Prenota una visita
          </Link>
          <Link className="pulsante chiaro" to="/prenotazioni">
            Le mie prenotazioni
          </Link>
        </div>
      )}
      {utente?.ruolo === "medico" && (
        <div className="azioni">
          <Link className="pulsante" to="/agenda">
            La mia agenda
          </Link>
        </div>
      )}
      {utente?.ruolo === "segreteria" && (
        <div className="azioni">
          <Link className="pulsante" to="/segreteria">
            Gestione clinica
          </Link>
        </div>
      )}
    </div>
  );
}