import enum


class Ruolo(str, enum.Enum):
    PAZIENTE = "paziente"
    MEDICO = "medico"
    SEGRETERIA = "segreteria"


class StatoSlot(str, enum.Enum):
    LIBERO = "libero"
    OCCUPATO = "occupato"
    # Eliminato da medico o segreteria: resta nel database
    # perché può avere prenotazioni annullate nello storico
    RIMOSSO = "rimosso"


class StatoPrenotazione(str, enum.Enum):
    CONFERMATA = "confermata"
    ANNULLATA = "annullata"


def valori(enum_cls):
    """Salva nel database il valore ('libero') e non il nome ('LIBERO')."""
    return [membro.value for membro in enum_cls]