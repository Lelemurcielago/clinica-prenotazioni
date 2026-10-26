from sqlalchemy.orm import Session

from app.models import Paziente, Utente


class UtenteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, utente_id: int) -> Utente | None:
        return self.db.get(Utente, utente_id)

    def get_by_email(self, email: str) -> Utente | None:
        return self.db.query(Utente).filter(Utente.email == email).first()

    def codice_fiscale_esiste(self, codice_fiscale: str) -> bool:
        trovato = (
            self.db.query(Paziente)
            .filter(Paziente.codice_fiscale == codice_fiscale)
            .first()
        )
        return trovato is not None

    def salva_paziente(self, utente: Utente, paziente: Paziente) -> Utente:
        utente.paziente = paziente
        self.db.add(utente)
        self.db.commit()
        self.db.refresh(utente)
        return utente