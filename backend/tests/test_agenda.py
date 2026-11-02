def test_agenda_mostra_le_visite_confermate_del_medico(client, scenario, registra_paziente, login):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    client.post(
        "/prenotazioni",
        json={"slot_id": scenario["slot_ids"][0], "motivo": "Controllo"},
        headers=h_paziente,
    )

    r = client.get("/medici/me/agenda", headers=login("luca.bianchi@example.com"))

    assert r.status_code == 200
    voci = r.json()
    assert len(voci) == 1
    assert voci[0]["paziente_cognome"] == "Paziente"
    assert voci[0]["motivo"] == "Controllo"


def test_agenda_esclude_le_prenotazioni_annullate(client, scenario, registra_paziente, login):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    p = client.post(
        "/prenotazioni", json={"slot_id": scenario["slot_ids"][0]}, headers=h_paziente
    ).json()
    client.delete(f"/prenotazioni/{p['id']}", headers=h_paziente)

    r = client.get("/medici/me/agenda", headers=login("luca.bianchi@example.com"))

    assert r.status_code == 200
    assert r.json() == []


def test_agenda_vietata_ai_pazienti(client, scenario, registra_paziente):
    h_paziente = registra_paziente("mario@example.com", "RSSMRA80A01F205X")
    assert client.get("/medici/me/agenda", headers=h_paziente).status_code == 403