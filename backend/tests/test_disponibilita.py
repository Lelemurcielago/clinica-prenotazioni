from datetime import datetime, timedelta

from app.models import Medico, Ruolo, Utente
from app.security import hash_password
from tests.conftest import PASSWORD

EMAIL_MEDICO = "luca.bianchi@example.com"
EMAIL_SEGRETERIA = "anna.ferri@example.com"


def id_slot_liberi(client, medico_id):
    return [s["id"] for s in client.get(f"/medici/{medico_id}/slot").json()]


def test_il_medico_vede_le_proprie_disponibilita_libere_e_prenotate(
    client, scenario, registra_paziente, login
):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    prenotato, libero = scenario["slot_ids"]
    client.post("/prenotazioni", json={"slot_id": prenotato}, headers=h_paziente)

    r = client.get("/medici/me/slot", headers=login(EMAIL_MEDICO))

    assert r.status_code == 200
    stati = {s["id"]: s["stato"] for s in r.json()}
    assert stati == {prenotato: "occupato", libero: "libero"}


def test_il_medico_elimina_uno_slot_libero(client, scenario, login):
    h_medico = login(EMAIL_MEDICO)
    slot_id = scenario["slot_ids"][0]

    r = client.delete(f"/slot/{slot_id}", headers=h_medico)

    assert r.status_code == 200
    assert r.json()["stato"] == "rimosso"
    assert slot_id not in id_slot_liberi(client, scenario["medico_id"])
    assert slot_id not in [s["id"] for s in client.get("/medici/me/slot", headers=h_medico).json()]
    # eliminarlo una seconda volta non è possibile
    assert client.delete(f"/slot/{slot_id}", headers=h_medico).status_code == 404


def test_uno_slot_prenotato_non_si_elimina(client, scenario, registra_paziente, login):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    slot_id = scenario["slot_ids"][0]
    client.post("/prenotazioni", json={"slot_id": slot_id}, headers=h_paziente)

    assert client.delete(f"/slot/{slot_id}", headers=login(EMAIL_SEGRETERIA)).status_code == 409


def test_slot_liberato_da_una_disdetta_si_puo_eliminare(client, scenario, registra_paziente, login):
    """Lo slot ha una prenotazione annullata nello storico, che deve restare leggibile."""
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    slot_id = scenario["slot_ids"][0]
    p = client.post("/prenotazioni", json={"slot_id": slot_id}, headers=h_paziente).json()
    client.delete(f"/prenotazioni/{p['id']}", headers=h_paziente)

    h_segreteria = login(EMAIL_SEGRETERIA)
    assert client.delete(f"/slot/{slot_id}", headers=h_segreteria).status_code == 200

    storico = client.get("/prenotazioni", headers=h_segreteria)
    assert storico.status_code == 200
    assert storico.json()[0]["stato"] == "annullata"


def test_il_medico_non_elimina_gli_slot_di_un_collega(client, scenario, db_session, login):
    collega = Utente(
        email="elena.conti@example.com", password_hash=hash_password(PASSWORD),
        ruolo=Ruolo.MEDICO, nome="Elena", cognome="Conti",
    )
    db_session.add(collega)
    db_session.flush()
    specialita_id = db_session.get(Medico, scenario["medico_id"]).specialita_id
    db_session.add(Medico(utente_id=collega.id, specialita_id=specialita_id))
    db_session.commit()

    r = client.delete(f"/slot/{scenario['slot_ids'][0]}", headers=login("elena.conti@example.com"))
    assert r.status_code == 403


def test_il_paziente_non_elimina_slot(client, scenario, registra_paziente):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    assert client.delete(f"/slot/{scenario['slot_ids'][0]}", headers=h_paziente).status_code == 403


def test_dopo_la_rimozione_l_orario_torna_disponibile(client, scenario, db_session, login):
    h_segreteria = login(EMAIL_SEGRETERIA)
    inizio = (datetime.now() + timedelta(days=4)).replace(hour=16, minute=0, second=0, microsecond=0)
    corpo = {
        "medico_id": scenario["medico_id"],
        "inizio": inizio.isoformat(),
        "fine": (inizio + timedelta(minutes=30)).isoformat(),
    }
    slot = client.post("/slot", json=corpo, headers=h_segreteria).json()
    client.delete(f"/slot/{slot['id']}", headers=h_segreteria)

    # lo slot rimosso non conta più come sovrapposizione
    assert client.post("/slot", json=corpo, headers=h_segreteria).status_code == 201
