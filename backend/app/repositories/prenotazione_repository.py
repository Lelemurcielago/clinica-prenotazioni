from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models import Medico, Paziente, Prenotazione, Slot, StatoPrenotazione

# Carica in poche query slot, medico, utente, specialità e paziente
CARICA_DETTAGLI = (
    joinedload(Prenotazione.slot).options(
        joinedload(Slot.medico).options(
            joinedload(Medico.utente),
            joinedload(Medico.specialita),
        )
    ),
    joinedload(Prenotazione.paziente).joinedload(Paziente.utente),
)


class PrenotazioneRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prenotazione_id: int) -> Prenotazione | None:
        return (
            self.db.query(Prenotazione)
            .options(*CARICA_DETTAGLI)
            .filter(Prenotazione.id == prenotazione_id)
            .first()
        )

    def del_paziente(self, paziente_id: int) -> list[Prenotazione]:
        return (
            self.db.query(Prenotazione)
            .options(*CARICA_DETTAGLI)
            .filter(Prenotazione.paziente_id == paziente_id)
            .order_by(Prenotazione.creata_il.desc())
            .all()
        )

    def tutte(self) -> list[Prenotazione]:
        return (
            self.db.query(Prenotazione)
            .options(*CARICA_DETTAGLI)
            .order_by(Prenotazione.creata_il.desc())
            .all()
        )

    def aggiungi(self, prenotazione: Prenotazione) -> None:
        self.db.add(prenotazione)
        self.db.commit()

    def salva(self) -> None:
        self.db.commit()

    def agenda_medico(self, medico_id: int, giorno: date | None = None) -> list[Prenotazione]:
        query = (
            self.db.query(Prenotazione)
            .join(Prenotazione.slot)
            .options(
                contains_eager(Prenotazione.slot),
                joinedload(Prenotazione.paziente).joinedload(Paziente.utente),
            )
            .filter(
                Slot.medico_id == medico_id,
                Prenotazione.stato == StatoPrenotazione.CONFERMATA,
            )
        )
        if giorno is not None:
            inizio_giorno = datetime.combine(giorno, time.min)
            query = query.filter(
                Slot.inizio >= inizio_giorno,
                Slot.inizio < inizio_giorno + timedelta(days=1),
            )
        else:
            query = query.filter(Slot.inizio >= datetime.now())
        return query.order_by(Slot.inizio).all()