from fastapi import FastAPI

from app import models  # noqa: F401  registra le entità
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Poliambulatorio Salus - API prenotazioni",
    description="API REST per la prenotazione di visite specialistiche.",
    version="0.1.0",
)


@app.get("/health", tags=["Sistema"])
def health():
    return {"stato": "ok"}