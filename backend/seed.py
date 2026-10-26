from datetime import date, datetime, time, timedelta

from app import models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models import Medico, Ruolo, Slot, Specialita, StatoSlot, Utente
from app.security import hash_password

PASSWORD = "password123"

SPECIALITA = ["Cardiologia", "Dermatologia", "Ortopedia"]
MEDICI = [
    ("luca.bianchi@example.com", "Luca", "Bianchi", "Cardiologia"),
    ("elena.conti@example.com", "Elena", "Conti", "Cardiologia"),
    ("giulia.verdi@example.com", "Giulia", "Verdi", "Dermatologia"),
    ("marco.neri@example.com", "Marco", "Neri", "Ortopedia"),
]
SEGRETERIA = ("anna.ferri@example.com", "Anna", "Ferri")


def get_or_create_utente(db, email, nome, cognome, ruolo):
    utente = db.query(Utente).filter(Utente.email == email).first()
    if utente is None:
        utente = Utente(
            email=email,
            password_hash=hash_password(PASSWORD),
            ruolo=ruolo,
            nome=nome,
            cognome=cognome,
        )
        db.add(utente)
        db.flush()
    return utente


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        specialita = {}
        for nome in SPECIALITA:
            s = db.query(Specialita).filter(Specialita.nome == nome).first()
            if s is None:
                s = Specialita(nome=nome)
                db.add(s)
                db.flush()
            specialita[nome] = s

        get_or_create_utente(db, *SEGRETERIA, Ruolo.SEGRETERIA)

        medici = []
        for email, nome, cognome, spec in MEDICI:
            utente = get_or_create_utente(db, email, nome, cognome, Ruolo.MEDICO)
            medico = db.query(Medico).filter(Medico.utente_id == utente.id).first()
            if medico is None:
                medico = Medico(utente_id=utente.id, specialita_id=specialita[spec].id)
                db.add(medico)
                db.flush()
            medici.append(medico)

        creati = 0
        oggi = date.today()
        for giorno in range(1, 8):
            data = oggi + timedelta(days=giorno)
            if data.weekday() >= 5:  # niente sabato e domenica
                continue
            for medico in medici:
                for ora in (9, 10, 11):
                    for minuto in (0, 30):
                        inizio = datetime.combine(data, time(ora, minuto))
                        esiste = (
                            db.query(Slot)
                            .filter(Slot.medico_id == medico.id, Slot.inizio == inizio)
                            .first()
                        )
                        if esiste is None:
                            db.add(
                                Slot(
                                    medico_id=medico.id,
                                    inizio=inizio,
                                    fine=inizio + timedelta(minutes=30),
                                    stato=StatoSlot.LIBERO,
                                )
                            )
                            creati += 1
        db.commit()
        print(f"Dati fittizi pronti. Nuovi slot creati: {creati}")
    finally:
        db.close()


if __name__ == "__main__":
    main()