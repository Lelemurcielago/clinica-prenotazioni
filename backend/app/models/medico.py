from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class Medico(Base):
    __tablename__ = "medici"

    id = Column(Integer, primary_key=True)
    utente_id = Column(Integer, ForeignKey("utenti.id"), unique=True, nullable=False)
    specialita_id = Column(Integer, ForeignKey("specialita.id"), nullable=False)

    utente = relationship("Utente", back_populates="medico")
    specialita = relationship("Specialita", back_populates="medici")
    slot = relationship("Slot", back_populates="medico")

    @property
    def nome(self) -> str:
        return self.utente.nome

    @property
    def cognome(self) -> str:
        return self.utente.cognome