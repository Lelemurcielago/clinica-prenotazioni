from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models import Medico, Ruolo, Slot, StatoSlot, Utente
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


class SlotNelPassato(Exception):
    pass


class SlotNonTrovato(Exception):
    pass


class SlotNonEliminabile(Exception):
    pass


class SlotService:
    def __init__(self, db: Session):
        self.medici = MedicoRepository(db)
        self.slot = SlotRepository(db)

    def _medico_di(self, utente: Utente) -> Medico:
        medico = self.medici.get_by_utente_id(utente.id)
        if medico is None:
            raise MedicoNonTrovato()
        return medico

    def miei_slot(self, utente: Utente, giorno: date | None) -> list[Slot]:
        return self.slot.del_medico(self._medico_di(utente).id, giorno)

    def rimuovi_slot(self, utente: Utente, slot_id: int) -> Slot:
        slot = self.slot.get_by_id(slot_id)
        if slot is None or slot.stato == StatoSlot.RIMOSSO:
            raise SlotNonTrovato()
        if utente.ruolo == Ruolo.MEDICO and slot.medico_id != self._medico_di(utente).id:
            raise MedicoNonAutorizzato()
        # Uno slot prenotato va prima disdetto: il paziente non deve perdere la visita in silenzio
        if slot.stato != StatoSlot.LIBERO:
            raise SlotNonEliminabile()

        slot.stato = StatoSlot.RIMOSSO
        return self.slot.salva(slot)

    def crea_slot(self, utente: Utente, dati: SlotCreate) -> Slot:
        if dati.inizio <= datetime.now():
            raise SlotNelPassato()

        if utente.ruolo == Ruolo.MEDICO:
            medico = self._medico_di(utente)
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
