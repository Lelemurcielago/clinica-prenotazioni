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
    </div>
  );
}