from pydantic import BaseModel, ConfigDict

from app.schemas.specialita import SpecialitaOut


class MedicoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cognome: str
    specialita: SpecialitaOut