from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import richiede_ruoli
from app.models import Ruolo, Utente
from app.schemas.errore import errori
from app.schemas.agenda import VoceAgenda
from app.schemas.slot import SlotOut
from app.services.agenda_service import AgendaService
from app.services.catalogo_service import MedicoNonTrovato
from app.services.slot_service import SlotService

router = APIRouter(tags=["Agenda"])


@router.get(
    "/medici/me/agenda", response_model=list[VoceAgenda], responses=errori(401, 403, 404)
)
def agenda_medico(
    data: date | None = None,
    utente: Utente = Depends(richiede_ruoli(Ruolo.MEDICO)),
    db: Session = Depends(get_db),
):
    """Visite confermate del medico autenticato, per un giorno o da oggi in poi."""
    try:
        return AgendaService(db).agenda(utente, data)
    except MedicoNonTrovato:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profilo medico non trovato")


@router.get("/medici/me/slot", response_model=list[SlotOut], responses=errori(401, 403, 404))
def miei_slot(
    data: date | None = None,
    utente: Utente = Depends(richiede_ruoli(Ruolo.MEDICO)),
    db: Session = Depends(get_db),
):
    """Disponibilità del medico autenticato (libere e prenotate), per un giorno o da oggi in poi."""
    try:
        return SlotService(db).miei_slot(utente, data)
    except MedicoNonTrovato:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profilo medico non trovato")
