from datetime import datetime, timedelta


def test_la_segreteria_vede_il_nome_del_paziente(client, scenario, registra_paziente, login):
    h = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    client.post("/prenotazioni", json={"slot_id": scenario["slot_ids"][0]}, headers=h)

    r = client.get("/prenotazioni", headers=login("anna.ferri@example.com"))

    assert r.status_code == 200
    assert r.json()[0]["paziente_cognome"] == "Paziente"


def test_la_segreteria_crea_slot_per_un_medico(client, scenario, login):
    h = login("anna.ferri@example.com")
    inizio = (datetime.now() + timedelta(days=3)).replace(hour=15, minute=0, second=0, microsecond=0)
    fine = inizio + timedelta(minutes=30)
    corpo = {"inizio": inizio.isoformat(), "fine": fine.isoformat()}

    # senza indicare il medico la richiesta non è valida
    assert client.post("/slot", json=corpo, headers=h).status_code == 422

    con_medico = {**corpo, "medico_id": scenario["medico_id"]}
    assert client.post("/slot", json=con_medico, headers=h).status_code == 201
    # lo stesso orario si sovrappone
    assert client.post("/slot", json=con_medico, headers=h).status_code == 409