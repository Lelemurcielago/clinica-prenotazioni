import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ruolo, Utente
from app.repositories.utente_repository import UtenteRepository
from app.security import decodifica_token

schema_bearer = HTTPBearer()


def get_utente_corrente(
    credenziali: HTTPAuthorizationCredentials = Depends(schema_bearer),
    db: Session = Depends(get_db),
) -> Utente:
    non_autorizzato = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token non valido o scaduto",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decodifica_token(credenziali.credentials)
        utente_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise non_autorizzato

    utente = UtenteRepository(db).get_by_id(utente_id)
    if utente is None:
        raise non_autorizzato
    return utente


def richiede_ruoli(*ruoli: Ruolo):
    def verifica(utente: Utente = Depends(get_utente_corrente)) -> Utente:
        if utente.ruolo not in ruoli:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permessi insufficienti",
            )
        return utente

    return verifica