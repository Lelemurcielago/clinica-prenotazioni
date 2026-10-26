from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import StatoSlot, valori


class Slot(Base):
    __tablename__ = "slot"

    id = Column(Integer, primary_key=True)
    medico_id = Column(Integer, ForeignKey("medici.id"), nullable=False)
    inizio = Column(DateTime, nullable=False)
    fine = Column(DateTime, nullable=False)
    stato = Column(
        Enum(StatoSlot, values_callable=valori),
        nullable=False,
        default=StatoSlot.LIBERO,
    )

    medico = relationship("Medico", back_populates="slot")
    prenotazioni = relationship("Prenotazione", back_populates="slot")