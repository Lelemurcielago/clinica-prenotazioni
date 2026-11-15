from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, String, text
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import StatoPrenotazione, valori


class Prenotazione(Base):
    __tablename__ = "prenotazioni"
    __table_args__ = (
        # Al massimo una prenotazione CONFERMATA per slot: quelle annullate
        # restano come storico e non violano il vincolo.
        Index(
            "uq_prenotazione_confermata_per_slot",
            "slot_id",
            unique=True,
            sqlite_where=text("stato = 'confermata'"),
            postgresql_where=text("stato = 'confermata'"),
        ),
    )

    id = Column(Integer, primary_key=True)
    paziente_id = Column(Integer, ForeignKey("pazienti.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slot.id"), nullable=False)
    stato = Column(
        Enum(StatoPrenotazione, values_callable=valori),
        nullable=False,
        default=StatoPrenotazione.CONFERMATA,
    )
    motivo = Column(String(500))
    # Ora locale senza fuso orario, come gli orari degli slot
    creata_il = Column(DateTime, nullable=False, default=datetime.now)

    paziente = relationship("Paziente", back_populates="prenotazioni")
    slot = relationship("Slot", back_populates="prenotazioni")

    @property
    def paziente_nome(self) -> str:
        return self.paziente.utente.nome

    @property
    def paziente_cognome(self) -> str:
        return self.paziente.utente.cognome