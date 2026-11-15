from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models import Medico, Utente


class MedicoRepository:
    def __init__(self, db: Session):
        self.db = db

    def elenco(self, specialita_id: int | None = None) -> list[Medico]:
        query = (
            self.db.query(Medico)
            .join(Medico.utente)
            .options(contains_eager(Medico.utente), joinedload(Medico.specialita))
        )
        if specialita_id is not None:
            query = query.filter(Medico.specialita_id == specialita_id)
        return query.order_by(Utente.cognome, Utente.nome).all()

    def get_by_id(self, medico_id: int) -> Medico | None:
        return self.db.get(Medico, medico_id)

    def get_by_utente_id(self, utente_id: int) -> Medico | None:
        return self.db.query(Medico).filter(Medico.utente_id == utente_id).first()