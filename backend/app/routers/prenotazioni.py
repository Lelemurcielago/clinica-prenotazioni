from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import richiede_ruoli
from app.models import Ruolo, Utente
from app.schemas.prenotazione import PrenotazioneCreate, PrenotazioneOut
from app.services.prenotazione_service import (
    OperazioneNonConsentita,
    PrenotazioneGiaAnnullata,
    PrenotazioneNonTrovata,
    PrenotazioneService,
    SlotNonDisponibile,
    SlotNonTrovato,
    VisitaGiaPassata,
)

router = APIRouter(prefix="/prenotazioni", tags=["Prenotazioni"])


@router.post("", response_model=PrenotazioneOut, status_code=status.HTTP_201_CREATED)
def prenota(
    dati: PrenotazioneCreate,
    utente: Utente = Depends(richiede_ruoli(Ruolo.PAZIENTE)),
    db: Session = Depends(get_db),
):
    """Prenota uno slot libero (solo pazienti)."""
    try:
        return PrenotazioneService(db).prenota(utente, dati)
    except SlotNonTrovato:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot non trovato")
    except SlotNonDisponibile:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slot non disponibile")


@router.get("", response_model=list[PrenotazioneOut])
def elenco(
    utente: Utente = Depends(richiede_ruoli(Ruolo.PAZIENTE, Ruolo.SEGRETERIA)),
    db: Session = Depends(get_db),
):
    """Le prenotazioni del paziente; la segreteria vede tutte quelle della clinica."""
    return PrenotazioneService(db).elenco(utente)


@router.delete("/{prenotazione_id}", response_model=PrenotazioneOut)
def disdici(
    prenotazione_id: int,
    utente: Utente = Depends(richiede_ruoli(Ruolo.PAZIENTE, Ruolo.SEGRETERIA)),
    db: Session = Depends(get_db),
):
    """Disdice una prenotazione: passa ad 'annullata' e lo slot torna libero."""
    try:
        return PrenotazioneService(db).disdici(utente, prenotazione_id)
    except PrenotazioneNonTrovata:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prenotazione non trovata")
    except OperazioneNonConsentita:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Non puoi disdire la prenotazione di un altro paziente")
    except PrenotazioneGiaAnnullata:
        raise HTTPException(status.HTTP_409_CONFLICT, "Prenotazione già annullata")
    except VisitaGiaPassata:
        raise HTTPException(status.HTTP_409_CONFLICT, "La visita è già passata")