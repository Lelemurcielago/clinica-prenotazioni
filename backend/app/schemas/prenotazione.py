from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StatoPrenotazione
from app.schemas.medico import MedicoOut
from app.schemas.slot import SlotOut


class PrenotazioneCreate(BaseModel):
    slot_id: int
    motivo: str | None = Field(default=None, max_length=500)


class SlotDettaglioOut(SlotOut):
    medico: MedicoOut


class PrenotazioneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paziente_id: int
    stato: StatoPrenotazione
    motivo: str | None
    creata_il: datetime
    slot: SlotDettaglioOut
    paziente_id: int
    paziente_nome: str
    paziente_cognome: str