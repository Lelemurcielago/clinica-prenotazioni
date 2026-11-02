import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, ErroreApi } from "../api/client";
import { useAuth } from "../auth/contesto";

export default function RegistrazionePage() {
  const { utente, login } = useAuth();
  const navigate = useNavigate();
  const [dati, setDati] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    codice_fiscale: "",
    data_nascita: "",
    password: "",
  });
  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);

  if (utente) return <Navigate to="/" replace />;

  function aggiorna(campo: keyof typeof dati, valore: string) {
    setDati((precedente) => ({ ...precedente, [campo]: valore }));
  }

  function campo(nome: keyof typeof dati, etichetta: string, tipo = "text", obbligatorio = true) {
    return (
      <label>
        {etichetta}
        <input
          type={tipo}
          value={dati[nome]}
          required={obbligatorio}
          onChange={(e) => aggiorna(nome, e.target.value)}
        />
      </label>
    );
  }

  async function gestisciInvio(e: { preventDefault: () => void }) {
    e.preventDefault();
    setErrore(null);

    if (dati.codice_fiscale.length !== 16) {
      setErrore("Il codice fiscale deve avere 16 caratteri");
      return;
    }
    if (dati.password.length < 8) {
      setErrore("La password deve avere almeno 8 caratteri");
      return;
    }

    setInvio(true);
    try {
      await api.registra({ ...dati, telefono: dati.telefono || null });
      await login(dati.email, dati.password);
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
        <h2>Registrazione paziente</h2>
        <form onSubmit={gestisciInvio}>
          {campo("nome", "Nome")}
          {campo("cognome", "Cognome")}
          {campo("email", "Email", "email")}
          {campo("telefono", "Telefono (facoltativo)", "tel", false)}
          {campo("codice_fiscale", "Codice fiscale")}
          {campo("data_nascita", "Data di nascita", "date")}
          {campo("password", "Password (almeno 8 caratteri)", "password")}
          {errore && <p className="errore">{errore}</p>}
          <button type="submit" disabled={invio}>
            {invio ? "Registrazione in corso…" : "Registrati"}
          </button>
        </form>
        <p>
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}