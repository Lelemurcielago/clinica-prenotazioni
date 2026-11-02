from datetime import date

from sqlalchemy.orm import Session

from app.models import Utente
from app.repositories.medico_repository import MedicoRepository
from app.repositories.prenotazione_repository import PrenotazioneRepository
from app.schemas.agenda import VoceAgenda
from app.services.catalogo_service import MedicoNonTrovato


class AgendaService:
    def __init__(self, db: Session):
        self.medici = MedicoRepository(db)
        self.prenotazioni = PrenotazioneRepository(db)

    def agenda(self, utente: Utente, giorno: date | None) -> list[VoceAgenda]:
        medico = self.medici.get_by_utente_id(utente.id)
        if medico is None:
            raise MedicoNonTrovato()
        return [
            VoceAgenda(
                prenotazione_id=p.id,
                inizio=p.slot.inizio,
                fine=p.slot.fine,
                motivo=p.motivo,
                paziente_nome=p.paziente.utente.nome,
                paziente_cognome=p.paziente.utente.cognome,
            )
            for p in self.prenotazioni.agenda_medico(medico.id, giorno)
        ]