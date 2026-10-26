from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models import Slot, StatoSlot


class SlotRepository:
    def __init__(self, db: Session):
        self.db = db

    def liberi(self, medico_id: int, giorno: date | None = None) -> list[Slot]:
        query = self.db.query(Slot).filter(
            Slot.medico_id == medico_id, Slot.stato == StatoSlot.LIBERO
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

    def esiste_sovrapposizione(self, medico_id: int, inizio: datetime, fine: datetime) -> bool:
        trovato = (
            self.db.query(Slot)
            .filter(Slot.medico_id == medico_id, Slot.inizio < fine, Slot.fine > inizio)
            .first()
        )
        return trovato is not None

    def aggiungi(self, slot: Slot) -> Slot:
        self.db.add(slot)
        self.db.commit()
        self.db.refresh(slot)
        return slot