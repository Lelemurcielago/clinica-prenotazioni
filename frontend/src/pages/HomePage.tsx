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
      {utente?.ruolo === "paziente" ? (
        <div className="azioni">
          <Link className="pulsante" to="/prenota">
            Prenota una visita
          </Link>
          <Link className="pulsante chiaro" to="/prenotazioni">
            Le mie prenotazioni
          </Link>
        </div>
      ) : (
        <p>Le funzioni per questo ruolo arrivano nel prossimo passo.</p>
      )}
    </div>
  );
}