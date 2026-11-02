import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ErroreApi } from "../api/client";
import { useAuth } from "../auth/contesto";

export default function LoginPage() {
  const { utente, login } = useAuth();
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
      setErrore(err instanceof ErroreApi ? err.message : "Impossibile contattare il server");
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="pagina-accesso">
      <div className="scheda">
        <h2>Accedi</h2>
        <form onSubmit={gestisciInvio}>
          <label>
            Email
            <input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {errore && <p className="errore">{errore}</p>}
          <button type="submit" disabled={invio}>
            {invio ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
        <p>
          Non hai un account? <Link to="/registrazione">Registrati come paziente</Link>
        </p>
      </div>
    </div>
  );
}