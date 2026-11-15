from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Query, Session

from app.models import Slot, StatoSlot


def filtra_periodo(query: Query, giorno: date | None) -> Query:
    """Slot di un giorno preciso, oppure da adesso in poi. Mai slot già trascorsi."""
    query = query.filter(Slot.inizio >= datetime.now())
    if giorno is not None:
        inizio_giorno = datetime.combine(giorno, time.min)
        query = query.filter(
            Slot.inizio >= inizio_giorno,
            Slot.inizio < inizio_giorno + timedelta(days=1),
        )
    return query


class SlotRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, slot_id: int) -> Slot | None:
        return self.db.get(Slot, slot_id)

    def liberi(self, medico_id: int, giorno: date | None = None) -> list[Slot]:
        query = self.db.query(Slot).filter(
            Slot.medico_id == medico_id,
            Slot.stato == StatoSlot.LIBERO,
        )
        return filtra_periodo(query, giorno).order_by(Slot.inizio).all()

    def del_medico(self, medico_id: int, giorno: date | None = None) -> list[Slot]:
        """Slot liberi e occupati del medico (esclusi quelli rimossi)."""
        query = self.db.query(Slot).filter(
            Slot.medico_id == medico_id,
            Slot.stato != StatoSlot.RIMOSSO,
        )
        return filtra_periodo(query, giorno).order_by(Slot.inizio).all()

    def esiste_sovrapposizione(self, medico_id: int, inizio: datetime, fine: datetime) -> bool:
        trovato = (
            self.db.query(Slot)
            .filter(
                Slot.medico_id == medico_id,
                Slot.stato != StatoSlot.RIMOSSO,
                Slot.inizio < fine,
                Slot.fine > inizio,
            )
            .first()
        )
        return trovato is not None

    def aggiungi(self, slot: Slot) -> Slot:
        self.db.add(slot)
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def salva(self, slot: Slot) -> Slot:
        self.db.commit()
        self.db.refresh(slot)
        return slot
