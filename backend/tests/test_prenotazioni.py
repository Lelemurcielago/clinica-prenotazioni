import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Paziente, Prenotazione, StatoPrenotazione

CF_A = "RSSMRA80A01F205X"
CF_B = "GLLNNA90C41F205Z"


def id_slot_liberi(client, medico_id):
    return [s["id"] for s in client.get(f"/medici/{medico_id}/slot").json()]


def test_prenota_slot_libero(client, scenario, registra_paziente):
    h = registra_paziente("mario@example.com", CF_A)
    slot_id = scenario["slot_ids"][0]

    r = client.post("/prenotazioni", json={"slot_id": slot_id, "motivo": "Controllo"}, headers=h)

    assert r.status_code == 201
    assert r.json()["stato"] == "confermata"
    assert r.json()["slot"]["medico"]["cognome"] == "Bianchi"
    assert slot_id not in id_slot_liberi(client, scenario["medico_id"])


def test_stesso_paziente_non_puo_prenotare_due_volte_lo_slot(client, scenario, registra_paziente):
    h = registra_paziente("mario@example.com", CF_A)
    corpo = {"slot_id": scenario["slot_ids"][0]}

    assert client.post("/prenotazioni", json=corpo, headers=h).status_code == 201
    assert client.post("/prenotazioni", json=corpo, headers=h).status_code == 409


def test_altro_paziente_non_puo_prenotare_slot_occupato(client, scenario, registra_paziente):
    h_a = registra_paziente("mario@example.com", CF_A)
    h_b = registra_paziente("anna@example.com", CF_B)
    corpo = {"slot_id": scenario["slot_ids"][0]}

    assert client.post("/prenotazioni", json=corpo, headers=h_a).status_code == 201
    assert client.post("/prenotazioni", json=corpo, headers=h_b).status_code == 409


def test_disdetta_libera_lo_slot_e_conserva_lo_storico(client, scenario, registra_paziente, login):
    h_a = registra_paziente("mario@example.com", CF_A)
    h_b = registra_paziente("anna@example.com", CF_B)
    slot_id = scenario["slot_ids"][0]

    prenotazione = client.post("/prenotazioni", json={"slot_id": slot_id}, headers=h_a).json()
    r = client.delete(f"/prenotazioni/{prenotazione['id']}", headers=h_a)
    assert r.status_code == 200
    assert r.json()["stato"] == "annullata"
    assert slot_id in id_slot_liberi(client, scenario["medico_id"])

    # disdire due volte non è possibile
    assert client.delete(f"/prenotazioni/{prenotazione['id']}", headers=h_a).status_code == 409

    # lo slot può essere prenotato da un altro paziente
    assert client.post("/prenotazioni", json={"slot_id": slot_id}, headers=h_b).status_code == 201

    # la segreteria vede entrambe: quella annullata (storico) e quella confermata
    h_segreteria = login("anna.ferri@example.com")
    stati = {p["stato"] for p in client.get("/prenotazioni", headers=h_segreteria).json()}
    assert stati == {"annullata", "confermata"}


def test_paziente_non_puo_disdire_prenotazione_altrui(client, scenario, registra_paziente):
    h_a = registra_paziente("mario@example.com", CF_A)
    h_b = registra_paziente("anna@example.com", CF_B)

    prenotazione = client.post(
        "/prenotazioni", json={"slot_id": scenario["slot_ids"][0]}, headers=h_a
    ).json()

    assert client.delete(f"/prenotazioni/{prenotazione['id']}", headers=h_b).status_code == 403


def test_medico_non_puo_prenotare(client, scenario, login):
    h_medico = login("luca.bianchi@example.com")
    r = client.post("/prenotazioni", json={"slot_id": scenario["slot_ids"][0]}, headers=h_medico)
    assert r.status_code == 403


def test_il_database_impedisce_due_prenotazioni_confermate_sullo_stesso_slot(
    db_session, client, scenario, registra_paziente
):
    """La regola vale anche se il controllo del servizio venisse aggirato."""
    registra_paziente("mario@example.com", CF_A)
    paziente_id = db_session.query(Paziente).first().id
    slot_id = scenario["slot_ids"][0]

    db_session.add_all(
        [
            Prenotazione(paziente_id=paziente_id, slot_id=slot_id, stato=StatoPrenotazione.CONFERMATA),
            Prenotazione(paziente_id=paziente_id, slot_id=slot_id, stato=StatoPrenotazione.CONFERMATA),
        ]
    )
    with pytest.raises(IntegrityError):
        db_session.commit()