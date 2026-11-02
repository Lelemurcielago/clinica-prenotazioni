from datetime import datetime, timedelta

from app.models import Slot, StatoSlot


def test_gli_slot_passati_non_vengono_mostrati(client, scenario, db_session):
    medico_id = scenario["medico_id"]
    inizio = datetime.now() - timedelta(hours=2)
    db_session.add(
        Slot(
            medico_id=medico_id,
            inizio=inizio,
            fine=inizio + timedelta(minutes=30),
            stato=StatoSlot.LIBERO,
        )
    )
    db_session.commit()

    oggi = datetime.now().date().isoformat()
    for parametri in ({}, {"data": oggi}):
        r = client.get(f"/medici/{medico_id}/slot", params=parametri)
        assert r.status_code == 200
        assert all(datetime.fromisoformat(s["inizio"]) > datetime.now() for s in r.json())