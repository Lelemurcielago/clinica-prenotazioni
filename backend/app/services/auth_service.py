from sqlalchemy.orm import Session

from app.models import Paziente, Ruolo, Utente
from app.repositories.utente_repository import UtenteRepository
from app.schemas.auth import Login, RegistrazionePaziente
from app.security import crea_token, hash_password, verifica_password


class EmailGiaRegistrata(Exception):
    pass


class CodiceFiscaleGiaRegistrato(Exception):
    pass


class CredenzialiNonValide(Exception):
    pass


class AuthService:
    def __init__(self, db: Session):
        self.repo = UtenteRepository(db)

    def registra_paziente(self, dati: RegistrazionePaziente) -> Utente:
        email = dati.email.lower()
        if self.repo.get_by_email(email):
            raise EmailGiaRegistrata()
        if self.repo.codice_fiscale_esiste(dati.codice_fiscale):
            raise CodiceFiscaleGiaRegistrato()

        utente = Utente(
            email=email,
            password_hash=hash_password(dati.password),
            ruolo=Ruolo.PAZIENTE,
            nome=dati.nome,
            cognome=dati.cognome,
            telefono=dati.telefono,
        )
        paziente = Paziente(
            codice_fiscale=dati.codice_fiscale,
            data_nascita=dati.data_nascita,
        )
        return self.repo.salva_paziente(utente, paziente)

    def login(self, dati: Login) -> str:
        utente = self.repo.get_by_email(dati.email.lower())
        if utente is None or not verifica_password(dati.password, utente.password_hash):
            raise CredenzialiNonValide()
        return crea_token(utente.id, utente.ruolo.value)