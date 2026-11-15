from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import DURATA_TOKEN_MINUTI, SECRET_KEY

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verifica_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def crea_token(utente_id: int, ruolo: str) -> str:
    scadenza = datetime.now(timezone.utc) + timedelta(minutes=DURATA_TOKEN_MINUTI)
    payload = {"sub": str(utente_id), "ruolo": ruolo, "exp": scadenza}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decodifica_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])