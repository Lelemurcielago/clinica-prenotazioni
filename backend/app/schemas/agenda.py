from datetime import datetime

from pydantic import BaseModel


class VoceAgenda(BaseModel):
    prenotazione_id: int
    inizio: datetime
    fine: datetime
    motivo: str | None
    paziente_nome: str
    paziente_cognome: str