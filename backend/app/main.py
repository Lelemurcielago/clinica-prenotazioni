from fastapi import FastAPI

from app import models  # noqa: F401  registra le entità
from app.database import Base, engine
from app.routers import auth, catalogo, prenotazioni, slot

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Poliambulatorio Salus - API prenotazioni",
    description="API REST per la prenotazione di visite specialistiche.",
    version="0.1.0",
)

app.include_router(auth.router)
app.include_router(catalogo.router)
app.include_router(slot.router)
app.include_router(prenotazioni.router)


@app.get("/health", tags=["Sistema"])
def health():
    return {"stato": "ok"}