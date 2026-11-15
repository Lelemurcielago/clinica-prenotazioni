import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/contesto";
import LayoutAccesso from "../components/LayoutAccesso";
import { codiceFiscaleValido, messaggioErrore, oggi } from "../utils";

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

    const codiceFiscale = dati.codice_fiscale.trim().toUpperCase();
    if (!codiceFiscaleValido(codiceFiscale)) {
      setErrore("Il codice fiscale non è valido: controlla i 16 caratteri");
      return;
    }
    if (dati.data_nascita >= oggi()) {
      setErrore("La data di nascita deve essere nel passato");
      return;
    }
    if (dati.password.length < 8) {
      setErrore("La password deve avere almeno 8 caratteri");
      return;
    }

    setInvio(true);
    try {
      await api.registra({ ...dati, codice_fiscale: codiceFiscale, telefono: dati.telefono || null });
      await login(dati.email, dati.password);
      navigate("/");
    } catch (err) {
      setErrore(messaggioErrore(err));
    } finally {
      setInvio(false);
    }
  }

  return (
    <LayoutAccesso>
      <h2>Crea il tuo account</h2>
      <p className="sottotitolo">Registrati come paziente per prenotare le tue visite.</p>
      <form onSubmit={gestisciInvio}>
        <div className="campi-due">
          {campo("nome", "Nome")}
          {campo("cognome", "Cognome")}
        </div>
        {campo("email", "Email", "email")}
        <div className="campi-due">
          {campo("codice_fiscale", "Codice fiscale")}
          {campo("data_nascita", "Data di nascita", "date")}
        </div>
        {campo("telefono", "Telefono (facoltativo)", "tel", false)}
        {campo("password", "Password (almeno 8 caratteri)", "password")}
        {errore && <p className="errore">{errore}</p>}
        <button type="submit" className="grande" disabled={invio}>
          {invio ? "Registrazione in corso…" : "Registrati"}
        </button>
      </form>
      <p className="cambio">
        Hai già un account? <Link to="/login">Accedi</Link>
      </p>
    </LayoutAccesso>
  );
}