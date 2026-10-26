from fastapi import FastAPI

app = FastAPI(
    title="Poliambulatorio Salus - API prenotazioni",
    description="API REST per la prenotazione di visite specialistiche.",
    version="0.1.0",
)


@app.get("/health", tags=["Sistema"])
def health():
    return {"stato": "ok"}