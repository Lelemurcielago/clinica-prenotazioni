import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/contesto";

export default function Layout() {
  const { utente, logout } = useAuth();
  const navigate = useNavigate();

  function esci() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <header className="intestazione">
        <div className="sinistra">
          <h1>
            <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
              Poliambulatorio Salus
            </Link>
          </h1>
          {utente?.ruolo === "paziente" && (
            <nav className="menu">
              <NavLink to="/prenota">Prenota</NavLink>
              <NavLink to="/prenotazioni">Le mie prenotazioni</NavLink>
            </nav>
          )}
          {utente?.ruolo === "medico" && (
            <nav className="menu">
              <NavLink to="/agenda">La mia agenda</NavLink>
            </nav>
          )}
          {utente?.ruolo === "segreteria" && (
            <nav className="menu">
              <NavLink to="/segreteria">Gestione clinica</NavLink>
            </nav>
          )}
        </div>
        <div className="utente">
          <span>
            {utente?.nome} {utente?.cognome}
          </span>
          <button className="secondario" onClick={esci}>
            Esci
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}