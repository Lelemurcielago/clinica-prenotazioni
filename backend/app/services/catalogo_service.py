from datetime import date

from sqlalchemy.orm import Session

from app.models import Medico, Slot, Specialita
from app.repositories.medico_repository import MedicoRepository
from app.repositories.slot_repository import SlotRepository
from app.repositories.specialita_repository import SpecialitaRepository


class MedicoNonTrovato(Exception):
    pass


class CatalogoService:
    def __init__(self, db: Session):
        self.specialita = SpecialitaRepository(db)
        self.medici = MedicoRepository(db)
        self.slot = SlotRepository(db)

    def elenco_specialita(self) -> list[Specialita]:
        return self.specialita.elenco()

    def elenco_medici(self, specialita_id: int | None) -> list[Medico]:
        return self.medici.elenco(specialita_id)

    def slot_liberi(self, medico_id: int, giorno: date | None) -> list[Slot]:
        if self.medici.get_by_id(medico_id) is None:
            raise MedicoNonTrovato()
        return self.slot.liberi(medico_id, giorno)