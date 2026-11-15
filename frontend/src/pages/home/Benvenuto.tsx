import type { ReactNode } from "react";
import type { Utente } from "../../types";
import { saluto } from "../../utils";

export default function Benvenuto({ utente, children }: { utente: Utente; children?: ReactNode }) {
  const data = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <section className="benvenuto">
      <div>
        <h2>
          {saluto()}, {utente.nome}
        </h2>
        <p>{data}</p>
      </div>
      {children && <div className="azioni">{children}</div>}
    </section>
  );
}
