from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.enums import StatoSlot


class SlotCreate(BaseModel):
    medico_id: int | None = None  # obbligatorio solo per la segreteria
    inizio: datetime
    fine: datetime

    @field_validator("inizio", "fine")
    @classmethod
    def senza_fuso_orario(cls, valore: datetime) -> datetime:
        return valore.replace(tzinfo=None)

    @model_validator(mode="after")
    def fine_dopo_inizio(self):
        if self.fine <= self.inizio:
            raise ValueError("fine deve essere successiva a inizio")
        return self


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medico_id: int
    inizio: datetime
    fine: datetime
    stato: StatoSlot