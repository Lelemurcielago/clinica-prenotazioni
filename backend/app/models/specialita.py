from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Specialita(Base):
    __tablename__ = "specialita"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), unique=True, nullable=False)

    medici = relationship("Medico", back_populates="specialita")
