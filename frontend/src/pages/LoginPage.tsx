import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/contesto";
import LayoutAccesso from "../components/LayoutAccesso";
import { messaggioErrore } from "../utils";

export default function LoginPage() {
  const { utente, sessioneScaduta, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  if (utente) return <Navigate to="/" replace />;

  async function gestisciInvio(e: { preventDefault: () => void }) {
    e.preventDefault();
    setErrore(null);
    setInvio(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setErrore(messaggioErrore(err));
    } finally {
      setInvio(false);
    }
  }

  return (
    <LayoutAccesso>
      <h2>Bentornato</h2>
      <p className="sottotitolo">Accedi per gestire le tue visite.</p>
      {sessioneScaduta && <p className="avviso">La sessione è scaduta: accedi di nuovo.</p>}
      <form onSubmit={gestisciInvio}>
        <label>
          Email
          <input
            type="email"
            value={email}
            required
            autoComplete="email"
            placeholder="nome@esempio.it"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            required
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {errore && <p className="errore">{errore}</p>}
        <button type="submit" className="grande" disabled={invio}>
          {invio ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
      <p className="cambio">
        Non hai un account? <Link to="/registrazione">Registrati come paziente</Link>
      </p>
    </LayoutAccesso>
  );
}