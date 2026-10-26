from sqlalchemy.orm import Session

from app.models import Ruolo, Slot, StatoSlot, Utente
from app.repositories.medico_repository import MedicoRepository
from app.repositories.slot_repository import SlotRepository
from app.schemas.slot import SlotCreate
from app.services.catalogo_service import MedicoNonTrovato


class MedicoNonSpecificato(Exception):
    pass


class MedicoNonAutorizzato(Exception):
    pass


class SlotSovrapposto(Exception):
    pass


class SlotService:
    def __init__(self, db: Session):
        self.medici = MedicoRepository(db)
        self.slot = SlotRepository(db)

    def crea_slot(self, utente: Utente, dati: SlotCreate) -> Slot:
        if utente.ruolo == Ruolo.MEDICO:
            medico = self.medici.get_by_utente_id(utente.id)
            if medico is None:
                raise MedicoNonTrovato()
            if dati.medico_id not in (None, medico.id):
                raise MedicoNonAutorizzato()
        else:
            if dati.medico_id is None:
                raise MedicoNonSpecificato()
            medico = self.medici.get_by_id(dati.medico_id)
            if medico is None:
                raise MedicoNonTrovato()

        if self.slot.esiste_sovrapposizione(medico.id, dati.inizio, dati.fine):
            raise SlotSovrapposto()

        return self.slot.aggiungi(
            Slot(
                medico_id=medico.id,
                inizio=dati.inizio,
                fine=dati.fine,
                stato=StatoSlot.LIBERO,
            )
        )
    