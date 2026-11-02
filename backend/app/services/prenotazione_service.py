from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Prenotazione, Ruolo, StatoPrenotazione, StatoSlot, Utente
from app.repositories.prenotazione_repository import PrenotazioneRepository
from app.repositories.slot_repository import SlotRepository
from app.schemas.prenotazione import PrenotazioneCreate


class SlotNonTrovato(Exception):
    pass


class SlotNonDisponibile(Exception):
    pass


class PrenotazioneNonTrovata(Exception):
    pass


class OperazioneNonConsentita(Exception):
    pass


class PrenotazioneGiaAnnullata(Exception):
    pass


class VisitaGiaPassata(Exception):
    pass


class PrenotazioneService:
    def __init__(self, db: Session):
        self.db = db
        self.prenotazioni = PrenotazioneRepository(db)
        self.slot = SlotRepository(db)

    def prenota(self, utente: Utente, dati: PrenotazioneCreate) -> Prenotazione:
        slot = self.slot.get_by_id(dati.slot_id)
        if slot is None:
            raise SlotNonTrovato()
        if slot.stato != StatoSlot.LIBERO or slot.inizio <= datetime.now():
            raise SlotNonDisponibile()

        prenotazione = Prenotazione(
            paziente_id=utente.paziente.id,
            slot_id=slot.id,
            motivo=dati.motivo,
            stato=StatoPrenotazione.CONFERMATA,
        )
        slot.stato = StatoSlot.OCCUPATO

        try:
            # Un'unica transazione: nuova prenotazione + slot occupato.
            # Se due richieste arrivano insieme, l'indice univoco del database
            # fa fallire la seconda con IntegrityError.
            self.prenotazioni.aggiungi(prenotazione)
        except IntegrityError:
            self.db.rollback()
            raise SlotNonDisponibile()

        return self.prenotazioni.get_by_id(prenotazione.id)

    def elenco(self, utente: Utente) -> list[Prenotazione]:
        if utente.ruolo == Ruolo.PAZIENTE:
            return self.prenotazioni.del_paziente(utente.paziente.id)
        return self.prenotazioni.tutte()

    def disdici(self, utente: Utente, prenotazione_id: int) -> Prenotazione:
        prenotazione = self.prenotazioni.get_by_id(prenotazione_id)
        if prenotazione is None:
            raise PrenotazioneNonTrovata()
        if utente.ruolo == Ruolo.PAZIENTE and prenotazione.paziente_id != utente.paziente.id:
            raise OperazioneNonConsentita()
        if prenotazione.stato == StatoPrenotazione.ANNULLATA:
            raise PrenotazioneGiaAnnullata()
        if prenotazione.slot.inizio <= datetime.now():
            raise VisitaGiaPassata()

        prenotazione.stato = StatoPrenotazione.ANNULLATA
        prenotazione.slot.stato = StatoSlot.LIBERO
        self.prenotazioni.salva()

        return self.prenotazioni.get_by_id(prenotazione_id)