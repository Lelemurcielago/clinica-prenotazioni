import type { ReactNode } from "react";
import Icona from "./Icona";
import { Logo } from "./Layout";
import SfondoDecorativo from "./SfondoDecorativo";

// Pagine di login e registrazione: pannello del marchio a sinistra, modulo a destra
export default function LayoutAccesso({ children }: { children: ReactNode }) {
  return (
    <div className="accesso">
      <aside className="accesso-marchio">
        <Logo />
        <div>
          <h2>La tua salute, senza code al telefono.</h2>
          <p>Prenota visite specialistiche in pochi clic, quando vuoi e da qualsiasi dispositivo.</p>
        </div>
        <ul className="vantaggi">
          <li>
            <span>
              <Icona nome="stetoscopio" />
            </span>
            Medici specialisti in diverse discipline
          </li>
          <li>
            <span>
              <Icona nome="orologio" />
            </span>
            Disponibilità aggiornate in tempo reale
          </li>
          <li>
            <span>
              <Icona nome="scudo" />
            </span>
            Dati protetti e accesso sicuro
          </li>
        </ul>
      </aside>
      <section className="accesso-modulo">
        <SfondoDecorativo variante="accesso" />
        <div>{children}</div>
      </section>
    </div>
  );
}
