from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import richiede_ruoli
from app.models import Ruolo, Utente
from app.schemas.errore import errori
from app.schemas.slot import SlotCreate, SlotOut
from app.services.catalogo_service import MedicoNonTrovato
from app.services.slot_service import (
    MedicoNonAutorizzato,
    MedicoNonSpecificato,
    SlotNelPassato,
    SlotNonEliminabile,
    SlotNonTrovato,
    SlotService,
    SlotSovrapposto,
)

router = APIRouter(prefix="/slot", tags=["Disponibilità"])


@router.post(
    "",
    response_model=SlotOut,
    status_code=status.HTTP_201_CREATED,
    responses=errori(401, 403, 404, 409, e409="Lo slot si sovrappone a uno esistente"),
)
def crea_slot(
    dati: SlotCreate,
    utente: Utente = Depends(richiede_ruoli(Ruolo.MEDICO, Ruolo.SEGRETERIA)),
    db: Session = Depends(get_db),
):
    """Crea uno slot di disponibilità. Il medico lo crea per sé, la segreteria indica medico_id."""
    try:
        return SlotService(db).crea_slot(utente, dati)
    except SlotNelPassato:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Lo slot deve iniziare nel futuro")
    except MedicoNonTrovato:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Medico non trovato")
    except MedicoNonSpecificato:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Indicare medico_id")
    except MedicoNonAutorizzato:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Puoi creare slot solo per te stesso")
    except SlotSovrapposto:
        raise HTTPException(status.HTTP_409_CONFLICT, "Lo slot si sovrappone a uno esistente")


@router.delete(
    "/{slot_id}",
    response_model=SlotOut,
    responses=errori(401, 403, 404, 409, e409="Lo slot è prenotato"),
)
def rimuovi_slot(
    slot_id: int,
    utente: Utente = Depends(richiede_ruoli(Ruolo.MEDICO, Ruolo.SEGRETERIA)),
    db: Session = Depends(get_db),
):
    """Elimina uno slot libero: passa a 'rimosso' e non è più prenotabile."""
    try:
        return SlotService(db).rimuovi_slot(utente, slot_id)
    except (SlotNonTrovato, MedicoNonTrovato):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot non trovato")
    except MedicoNonAutorizzato:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Puoi eliminare solo i tuoi slot")
    except SlotNonEliminabile:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Lo slot è prenotato: disdire prima la prenotazione"
        )
