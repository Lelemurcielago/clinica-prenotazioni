import re
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import Ruolo

# Struttura del codice fiscale: cognome (3), nome (3), anno (2), mese (1),
# giorno e sesso (2), comune (4), carattere di controllo (1).
# Nelle parti numeriche sono ammesse anche le lettere usate per l'omocodia.
CIFRA = "[0-9LMNPQRSTUV]"
FORMATO_CODICE_FISCALE = re.compile(
    rf"^[A-Z]{{6}}{CIFRA}{{2}}[ABCDEHLMPRST]{CIFRA}{{2}}[A-Z]{CIFRA}{{3}}[A-Z]$"
)


class RegistrazionePaziente(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    nome: str = Field(min_length=1, max_length=100)
    cognome: str = Field(min_length=1, max_length=100)
    telefono: str | None = Field(default=None, max_length=30)
    codice_fiscale: str = Field(min_length=16, max_length=16)
    data_nascita: date

    @field_validator("codice_fiscale")
    @classmethod
    def codice_fiscale_valido(cls, valore: str) -> str:
        valore = valore.strip().upper()
        if not FORMATO_CODICE_FISCALE.match(valore):
            raise ValueError("Formato del codice fiscale non valido")
        return valore

    @field_validator("data_nascita")
    @classmethod
    def data_nascita_nel_passato(cls, valore: date) -> date:
        if valore >= date.today():
            raise ValueError("La data di nascita deve essere nel passato")
        return valore


class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UtenteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    nome: str
    cognome: str
    ruolo: Ruolo