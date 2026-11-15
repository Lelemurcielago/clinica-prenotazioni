from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.errore import errori
from app.schemas.medico import MedicoOut
from app.schemas.slot import SlotOut
from app.schemas.specialita import SpecialitaOut
from app.services.catalogo_service import CatalogoService, MedicoNonTrovato

router = APIRouter(tags=["Catalogo"])


@router.get("/specialita", response_model=list[SpecialitaOut])
def elenco_specialita(db: Session = Depends(get_db)):
    """Elenco delle specialità offerte dalla clinica."""
    return CatalogoService(db).elenco_specialita()


@router.get("/medici", response_model=list[MedicoOut])
def elenco_medici(specialita_id: int | None = None, db: Session = Depends(get_db)):
    """Elenco dei medici, filtrabile per specialità."""
    return CatalogoService(db).elenco_medici(specialita_id)


@router.get("/medici/{medico_id}/slot", response_model=list[SlotOut], responses=errori(404))
def slot_liberi(medico_id: int, data: date | None = None, db: Session = Depends(get_db)):
    """Slot liberi di un medico, per un giorno (AAAA-MM-GG) o da oggi in poi."""
    try:
        return CatalogoService(db).slot_liberi(medico_id, data)
    except MedicoNonTrovato:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Medico non trovato")