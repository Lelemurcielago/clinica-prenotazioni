from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  registra le entità
from app.database import Base, engine
from app.routers import agenda, auth, catalogo, prenotazioni, slot

Base.metadata.create_all(bind=engine)

DESCRIZIONE = """
API REST del **Poliambulatorio Salus** per la prenotazione di visite specialistiche.

**Autenticazione**: `POST /auth/login` restituisce un token JWT valido 60 minuti, da inviare
nell'intestazione `Authorization: Bearer <token>` (pulsante *Authorize* in questa pagina).

**Ruoli**: *paziente* (si registra e prenota), *medico* (agenda e disponibilità),
*segreteria* (vede e gestisce tutte le prenotazioni).

Gli errori hanno sempre la forma `{"detail": "messaggio"}`.
"""

GRUPPI = [
    {"name": "Autenticazione", "description": "Registrazione dei pazienti, login e profilo."},
    {"name": "Catalogo", "description": "Specialità, medici e slot liberi. Pubblico."},
    {"name": "Prenotazioni", "description": "Prenotazione e disdetta delle visite."},
    {"name": "Agenda", "description": "Visite e disponibilità del medico autenticato."},
    {"name": "Disponibilità", "description": "Creazione ed eliminazione degli slot."},
    {"name": "Sistema", "description": "Stato del servizio."},
]

app = FastAPI(
    title="Poliambulatorio Salus - API prenotazioni",
    description=DESCRIZIONE,
    version="1.0.0",
    openapi_tags=GRUPPI,
)

# Il front-end in sviluppo gira su un altro indirizzo (porta 5173):
# senza CORS il browser bloccherebbe le chiamate all'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
# L'agenda va registrata prima del catalogo: altrimenti "/medici/me/slot"
# verrebbe letto come "/medici/{medico_id}/slot" con medico_id = "me"
app.include_router(agenda.router)
app.include_router(catalogo.router)
app.include_router(slot.router)
app.include_router(prenotazioni.router)


@app.get("/health", tags=["Sistema"])
def health():
    return {"stato": "ok"}