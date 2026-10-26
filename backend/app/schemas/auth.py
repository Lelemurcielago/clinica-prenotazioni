from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import Ruolo


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
    def codice_fiscale_maiuscolo(cls, valore: str) -> str:
        return valore.upper()


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