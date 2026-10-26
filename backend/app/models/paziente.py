from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Paziente(Base):
    __tablename__ = "pazienti"

    id = Column(Integer, primary_key=True)
    utente_id = Column(Integer, ForeignKey("utenti.id"), unique=True, nullable=False)
    codice_fiscale = Column(String(16), unique=True, nullable=False)
    data_nascita = Column(Date, nullable=False)

    utente = relationship("Utente", back_populates="paziente")
    prenotazioni = relationship("Prenotazione", back_populates="paziente")