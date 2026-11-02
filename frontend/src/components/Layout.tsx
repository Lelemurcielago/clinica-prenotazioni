import { Link, Outlet, useNavigate } from "react-router-dom";
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
        <h1>
          <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
            Poliambulatorio Salus
          </Link>
        </h1>
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