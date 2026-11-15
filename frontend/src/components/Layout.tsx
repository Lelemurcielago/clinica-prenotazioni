import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/contesto";
import type { Ruolo } from "../types";
import { Avatar } from "./Elementi";
import Icona, { type NomeIcona } from "./Icona";
import SfondoDecorativo from "./SfondoDecorativo";

const MENU: Record<Ruolo, { percorso: string; etichetta: string; icona: NomeIcona }[]> = {
  paziente: [
    { percorso: "/prenota", etichetta: "Prenota", icona: "piu" },
    { percorso: "/prenotazioni", etichetta: "Le mie prenotazioni", icona: "elenco" },
  ],
  medico: [{ percorso: "/agenda", etichetta: "La mia agenda", icona: "calendario" }],
  segreteria: [{ percorso: "/segreteria", etichetta: "Gestione clinica", icona: "elenco" }],
};

export function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-segno">
        <Icona nome="cuore" dimensione={18} />
      </span>
      <span>
        Poliambulatorio Salus
        <small>Prenotazioni online</small>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { utente, logout } = useAuth();
  const navigate = useNavigate();

  function esci() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <SfondoDecorativo />
      <header className="intestazione">
        <div className="sinistra">
          <h1>
            <Logo />
          </h1>
          {utente && (
            <nav className="menu">
              <NavLink to="/" end>
                <Icona nome="grafico" dimensione={17} />
                Riepilogo
              </NavLink>
              {MENU[utente.ruolo].map((voce) => (
                <NavLink key={voce.percorso} to={voce.percorso}>
                  <Icona nome={voce.icona} dimensione={17} />
                  {voce.etichetta}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        {utente && (
          <div className="utente">
            <Avatar nome={utente.nome} cognome={utente.cognome} />
            <div className="utente-testo">
              <div className="utente-nome">
                {utente.nome} {utente.cognome}
              </div>
              <div className="utente-ruolo">{utente.ruolo}</div>
            </div>
            <button className="secondario" onClick={esci} title="Esci">
              <Icona nome="esci" dimensione={17} />
              Esci
            </button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
