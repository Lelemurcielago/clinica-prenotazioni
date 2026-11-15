from pydantic import BaseModel


class Errore(BaseModel):
    """Corpo delle risposte di errore: un messaggio leggibile dall'utente."""

    detail: str


# Il codice 422 (dati non validi) è documentato in automatico da FastAPI
DESCRIZIONI = {
    401: "Token mancante, non valido o scaduto",
    403: "L'utente non ha il ruolo o i permessi necessari",
    404: "Risorsa non trovata",
    409: "Conflitto con lo stato attuale (es. slot già prenotato)",
}


def errori(*codici: int, **descrizioni: str) -> dict:
    """Documenta in Swagger le risposte di errore di un endpoint.

    Esempio: errori(404, 409, e409="Slot già prenotato")
    """
    return {
        codice: {
            "model": Errore,
            "description": descrizioni.get(f"e{codice}", DESCRIZIONI[codice]),
        }
        for codice in codici
    }
