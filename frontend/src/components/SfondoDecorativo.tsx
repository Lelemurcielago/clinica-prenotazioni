// Illustrazioni a tratto sul tema della clinica, molto tenui e dietro al contenuto.
// Sono solo decorative: nascoste agli screen reader e non intercettano i clic.

function Stetoscopio() {
  return (
    <svg viewBox="0 0 200 220" className="disegno stetoscopio">
      <path d="M50 20v50a45 45 0 0 0 90 0V20" />
      <circle cx="50" cy="16" r="6" />
      <circle cx="140" cy="16" r="6" />
      <path d="M95 115v35a40 40 0 0 0 80 0v-20" />
      <circle cx="175" cy="115" r="16" />
      <circle cx="175" cy="115" r="6" />
    </svg>
  );
}

function Battito() {
  return (
    <svg viewBox="0 0 600 120" className="disegno battito" preserveAspectRatio="none">
      <path d="M0 60h150l18-30 22 70 26-100 24 90 16-30h110l14-20 16 40 14-20h200" />
    </svg>
  );
}

function CroceMedica() {
  return (
    <svg viewBox="0 0 160 160" className="disegno croce">
      <circle cx="80" cy="80" r="70" />
      <path d="M65 35h30v30h30v30H95v30H65V95H35V65h30z" />
    </svg>
  );
}

function Capsule() {
  return (
    <svg viewBox="0 0 180 160" className="disegno capsule">
      <g transform="rotate(-35 60 60)">
        <rect x="20" y="40" width="90" height="38" rx="19" />
        <path d="M65 40v38" />
      </g>
      <circle cx="130" cy="115" r="26" />
      <path d="M112 133l36-36" />
    </svg>
  );
}

function Cartella() {
  return (
    <svg viewBox="0 0 150 190" className="disegno cartella">
      <rect x="15" y="25" width="120" height="155" rx="12" />
      <rect x="50" y="12" width="50" height="26" rx="7" />
      <path d="M68 62h14v14h14v14H82v14H68V90H54V76h14z" />
      <path d="M40 130h70M40 150h50" />
    </svg>
  );
}

function Cuore() {
  return (
    <svg viewBox="0 0 120 110" className="disegno cuore">
      <path d="M60 100S10 70 10 38C10 20 23 10 37 10c11 0 18 6 23 14 5-8 12-14 23-14 14 0 27 10 27 28 0 32-50 62-50 62z" />
      <path d="M28 50h18l7-12 9 24 7-12h22" />
    </svg>
  );
}

// Piccoli "+" sparsi, come una trama leggera
function Piu({ x, y, s = 1 }: { x: string; y: string; s?: number }) {
  return (
    <svg viewBox="0 0 20 20" className="disegno piu" style={{ left: x, top: y, width: 18 * s, height: 18 * s }}>
      <path d="M10 2v16M2 10h16" />
    </svg>
  );
}

export default function SfondoDecorativo({ variante = "pagina" }: { variante?: "pagina" | "accesso" }) {
  return (
    <div className={`sfondo-decorativo ${variante}`} aria-hidden="true">
      <Battito />
      <Stetoscopio />
      <CroceMedica />
      <Capsule />
      <Cartella />
      <Cuore />
      <Piu x="8%" y="22%" />
      <Piu x="91%" y="14%" s={1.3} />
      <Piu x="4%" y="58%" s={0.8} />
      <Piu x="95%" y="52%" />
      <Piu x="12%" y="88%" s={1.2} />
      <Piu x="86%" y="92%" s={0.8} />
    </div>
  );
}
