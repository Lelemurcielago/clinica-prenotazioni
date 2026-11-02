from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import richiede_ruoli
from app.models import Ruolo, Utente
from app.schemas.agenda import VoceAgenda
from app.services.agenda_service import AgendaService
from app.services.catalogo_service import MedicoNonTrovato

router = APIRouter(tags=["Agenda"])


@router.get("/medici/me/agenda", response_model=list[VoceAgenda])
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