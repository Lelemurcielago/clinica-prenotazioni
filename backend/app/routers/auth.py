from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_utente_corrente
from app.models import Utente
from app.schemas.errore import errori
from app.schemas.auth import Login, RegistrazionePaziente, Token, UtenteOut
from app.services.auth_service import (
    AuthService,
    CodiceFiscaleGiaRegistrato,
    CredenzialiNonValide,
    EmailGiaRegistrata,
)

router = APIRouter(prefix="/auth", tags=["Autenticazione"])


@router.post(
    "/register",
    response_model=UtenteOut,
    status_code=status.HTTP_201_CREATED,
    responses=errori(409, e409="Email o codice fiscale già registrati"),
)
def registra(dati: RegistrazionePaziente, db: Session = Depends(get_db)):
    """Registra un nuovo paziente."""
    try:
        return AuthService(db).registra_paziente(dati)
    except EmailGiaRegistrata:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email già registrata")
    except CodiceFiscaleGiaRegistrato:
        raise HTTPException(status.HTTP_409_CONFLICT, "Codice fiscale già registrato")


@router.post("/login", response_model=Token, responses=errori(401, e401="Credenziali non valide"))
def login(dati: Login, db: Session = Depends(get_db)):
    """Restituisce un token JWT se le credenziali sono corrette."""
    try:
        token = AuthService(db).login(dati)
    except CredenzialiNonValide:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenziali non valide")
    return Token(access_token=token)


@router.get("/me", response_model=UtenteOut, responses=errori(401))
def profilo(utente: Utente = Depends(get_utente_corrente)):
    """Profilo dell'utente autenticato."""
    return utente