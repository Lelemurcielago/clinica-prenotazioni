"""Esporta la specifica OpenAPI (quella mostrata da Swagger su /docs) in docs/api/openapi.json.

Uso:  python esporta_openapi.py
"""
import json
import os
from pathlib import Path

# Database in memoria: l'esportazione non deve toccare il database reale
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.main import app  # noqa: E402

DESTINAZIONE = Path(__file__).resolve().parent.parent / "docs" / "api" / "openapi.json"


def main():
    DESTINAZIONE.parent.mkdir(parents=True, exist_ok=True)
    specifica = json.dumps(app.openapi(), ensure_ascii=False, indent=2)
    DESTINAZIONE.write_text(specifica + "\n", encoding="utf-8")
    print(f"Specifica OpenAPI salvata in {DESTINAZIONE}")


if __name__ == "__main__":
    main()
