DATI = {
    "email": "mario.rossi@example.com",
    "password": "password123",
    "nome": "Mario",
    "cognome": "Rossi",
    "codice_fiscale": "RSSMRA80A01F205X",
    "data_nascita": "1980-01-01",
}


def test_registrazione_login_e_profilo(client, login):
    r = client.post("/auth/register", json=DATI)
    assert r.status_code == 201
    assert r.json()["ruolo"] == "paziente"

    r = client.get("/auth/me", headers=login(DATI["email"]))
    assert r.status_code == 200
    assert r.json()["email"] == DATI["email"]


def test_email_gia_registrata(client):
    assert client.post("/auth/register", json=DATI).status_code == 201
    assert client.post("/auth/register", json=DATI).status_code == 409


def test_codice_fiscale_gia_registrato(client):
    client.post("/auth/register", json=DATI)
    altro = {**DATI, "email": "altro@example.com"}
    assert client.post("/auth/register", json=altro).status_code == 409


def test_login_con_password_errata(client):
    client.post("/auth/register", json=DATI)
    r = client.post("/auth/login", json={"email": DATI["email"], "password": "sbagliata1"})
    assert r.status_code == 401


def test_profilo_senza_token_rifiutato(client):
    assert client.get("/auth/me").status_code in (401, 403)


def test_password_troppo_corta(client):
    r = client.post("/auth/register", json={**DATI, "password": "corta"})
    assert r.status_code == 422