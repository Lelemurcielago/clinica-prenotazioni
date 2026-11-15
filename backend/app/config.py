import os

from dotenv import load_dotenv

# Legge le variabili dal file .env (se presente) nella cartella da cui si avvia il server
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./clinica.db")
SECRET_KEY = os.getenv("SECRET_KEY", "chiave-di-sviluppo-da-cambiare-in-produzione")
DURATA_TOKEN_MINUTI = int(os.getenv("DURATA_TOKEN_MINUTI", "60"))
