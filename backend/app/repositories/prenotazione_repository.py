from sqlalchemy.orm import Session, joinedload

from app.models import Medico, Prenotazione, Slot

# Carica in un'unica query slot, medico, utente e specialità
CARICA_DETTAGLI = joinedload(Prenotazione.slot).options(
    joinedload(Slot.medico).options(
        joinedload(Medico.utente),
        joinedload(Medico.specialita),
    )
)


class PrenotazioneRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prenotazione_id: int) -> Prenotazione | None:
        return (
            self.db.query(Prenotazione)
            .options(CARICA_DETTAGLI)
            .filter(Prenotazione.id == prenotazione_id)
            .first()
        )

    def del_paziente(self, paziente_id: int) -> list[Prenotazione]:
        return (
            self.db.query(Prenotazione)
            .options(CARICA_DETTAGLI)
            .filter(Prenotazione.paziente_id == paziente_id)
            .order_by(Prenotazione.creata_il.desc())
            .all()
        )

    def tutte(self) -> list[Prenotazione]:
        return (
            self.db.query(Prenotazione)
            .options(CARICA_DETTAGLI)
            .order_by(Prenotazione.creata_il.desc())
            .all()
        )

    def aggiungi(self, prenotazione: Prenotazione) -> None:
        self.db.add(prenotazione)
        self.db.commit()

    def salva(self) -> None:
        self.db.commit()