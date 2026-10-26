from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import Ruolo, valori


class Utente(Base):
    __tablename__ = "utenti"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    ruolo = Column(Enum(Ruolo, values_callable=valori), nullable=False)
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100), nullable=False)
    telefono = Column(String(30))

    paziente = relationship("Paziente", back_populates="utente", uselist=False)
    medico = relationship("Medico", back_populates="utente", uselist=False)