from datetime import date, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base, get_db
from app.main import app
from app.models import Medico, Ruolo, Slot, Specialita, StatoSlot, Utente
from app.security import hash_password

PASSWORD = "password123"


@pytest.fixture()
def db_session():
    """Database SQLite in memoria, nuovo per ogni test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def usa_db_di_test():
        yield db_session

    app.dependency_overrides[get_db] = usa_db_di_test
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def login(client):
    def _login(email, password=PASSWORD):
        r = client.post("/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _login


@pytest.fixture()
def registra_paziente(client, login):
    def _registra(email, codice_fiscale):
        r = client.post(
            "/auth/register",
            json={
                "email": email,
                "password": PASSWORD,
                "nome": "Test",
                "cognome": "Paziente",
                "codice_fiscale": codice_fiscale,
                "data_nascita": "1990-05-10",
            },
        )
        assert r.status_code == 201, r.text
        return login(email)

    return _registra


@pytest.fixture()
def scenario(db_session):
    """Una specialità, un medico, una segreteria e due slot liberi per domani."""
    spec = Specialita(nome="Cardiologia")
    db_session.add(spec)
    db_session.flush()

    u_medico = Utente(
        email="luca.bianchi@example.com", password_hash=hash_password(PASSWORD),
        ruolo=Ruolo.MEDICO, nome="Luca", cognome="Bianchi",
    )
    u_segreteria = Utente(
        email="anna.ferri@example.com", password_hash=hash_password(PASSWORD),
        ruolo=Ruolo.SEGRETERIA, nome="Anna", cognome="Ferri",
    )
    db_session.add_all([u_medico, u_segreteria])
    db_session.flush()

    medico = Medico(utente_id=u_medico.id, specialita_id=spec.id)
    db_session.add(medico)
    db_session.flush()

    domani = date.today() + timedelta(days=1)
    slot_ids = []
    for ora in (9, 10):
        inizio = datetime.combine(domani, time(ora, 0))
        slot = Slot(
            medico_id=medico.id, inizio=inizio,
            fine=inizio + timedelta(minutes=30), stato=StatoSlot.LIBERO,
        )
        db_session.add(slot)
        db_session.flush()
        slot_ids.append(slot.id)
    db_session.commit()

    return {"medico_id": medico.id, "slot_ids": slot_ids}