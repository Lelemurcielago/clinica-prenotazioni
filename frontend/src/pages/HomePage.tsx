import { useAuth } from "../auth/contesto";
import HomeMedico from "./home/HomeMedico";
import HomePaziente from "./home/HomePaziente";
import HomeSegreteria from "./home/HomeSegreteria";

// Ogni ruolo ha una propria dashboard con le informazioni più utili a colpo d'occhio
export default function HomePage() {
  const { utente } = useAuth();
  if (!utente) return null;
  if (utente.ruolo === "paziente") return <HomePaziente utente={utente} />;
  if (utente.ruolo === "medico") return <HomeMedico utente={utente} />;
  return <HomeSegreteria utente={utente} />;
}
