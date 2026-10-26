from sqlalchemy.orm import Session

from app.models import Specialita


class SpecialitaRepository:
    def __init__(self, db: Session):
        self.db = db

    def elenco(self) -> list[Specialita]:
        return self.db.query(Specialita).order_by(Specialita.nome).all()