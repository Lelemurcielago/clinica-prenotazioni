# Rapporto di Project Work

**Sviluppo di un'applicazione full-stack API-based per un'organizzazione del settore sanitario**

CdS Informatica per le Aziende Digitali (L-31) · Tema n. 1: La digitalizzazione dell'impresa · Traccia PW 16

---

## Indice

1. [Introduzione](#1-introduzione)
2. [Il contesto: il Poliambulatorio Salus](#2-il-contesto-il-poliambulatorio-salus)
3. [Analisi dei requisiti](#3-analisi-dei-requisiti)
4. [Design del sistema](#4-design-del-sistema)
5. [Documentazione delle API](#5-documentazione-delle-api)
6. [Il processo di sviluppo](#6-il-processo-di-sviluppo)
7. [Snippet di codice significativi](#7-snippet-di-codice-significativi)
8. [Test](#8-test)
9. [Repository del codice](#9-repository-del-codice)
10. [Conclusioni e sviluppi futuri](#10-conclusioni-e-sviluppi-futuri)

---

## 1. Introduzione

Questo rapporto descrive la progettazione e lo sviluppo di **Salus Prenotazioni**, un'applicazione web
full-stack che permette ai pazienti di un poliambulatorio privato di prenotare visite specialistiche
online. Permette inoltre ai medici di gestire agenda e disponibilità e alla segreteria di avere una
visione d'insieme dell'attività della struttura.

L'applicazione è costruita secondo un'architettura **API-based**:

- un **back-end RESTful** scritto in **Python** con il framework **FastAPI**, organizzato a oggetti e a
  livelli;
- un **front-end** single-page scritto in **React + TypeScript**, che comunica con il back-end solo
  attraverso le API HTTP/JSON.

Questa separazione è il punto centrale della traccia: le stesse API potrebbero servire in futuro
un'app mobile, un totem in sala d'attesa o un altro sistema della clinica, senza modificare il
back-end.

| Requisito della traccia | Dove si trova |
|---|---|
| Contesto dell'organizzazione e servizio offerto | [Capitolo 2](#2-il-contesto-il-poliambulatorio-salus) |
| Design: UML ed ER | [Capitolo 4](#4-design-del-sistema) |
| Documentazione delle API (Swagger) | [Capitolo 5](#5-documentazione-delle-api) e [`api/openapi.json`](api/openapi.json) |
| Codice front-end e back-end su Git | [Capitolo 9](#9-repository-del-codice) |
| Processo di sviluppo e snippet | [Capitoli 6 e 7](#6-il-processo-di-sviluppo) |
| Test funzionale con screenshot | [Capitolo 8](#8-test) |

---

## 2. Il contesto: il Poliambulatorio Salus

### 2.1 L'organizzazione

Il **Poliambulatorio Salus** è una struttura sanitaria privata di medie dimensioni, immaginata per
questo progetto ma rappresentativa di molte realtà italiane. Offre **visite specialistiche
ambulatoriali**: non ricovera pazienti, ma eroga prestazioni su appuntamento in diverse discipline
(nel prototipo cardiologia, dermatologia e ortopedia).

L'organico considerato è composto da:

- **medici specialisti**, ciascuno con una propria agenda di disponibilità;
- una **segreteria**, che accoglie i pazienti, gestisce gli appuntamenti e coordina le agende;
- i **pazienti**, cioè i clienti della struttura, che oggi prenotano quasi sempre per telefono o allo
  sportello.

### 2.2 Il problema

Nella situazione di partenza la gestione delle prenotazioni è in gran parte manuale:

- **la segreteria è il collo di bottiglia**: ogni prenotazione passa da una telefonata, con attese per
  il paziente e interruzioni continue per il personale;
- **le agende non sono condivise in tempo reale**: medici e segreteria lavorano su informazioni non
  allineate, con il rischio di **doppie prenotazioni** dello stesso orario;
- **le disdette sono difficili da comunicare** fuori dagli orari di apertura, così gli orari liberati
  spesso non vengono riassegnati e restano vuoti;
- **manca una visione d'insieme**: è difficile sapere quanto sono occupate le agende dei singoli
  medici e pianificare di conseguenza.

### 2.3 Il servizio digitale proposto

Il progetto digitalizza il **processo di prenotazione**, uno dei processi centrali della struttura.
L'applicazione offre:

- ai **pazienti**: la possibilità di registrarsi, consultare in autonomia le disponibilità
  reali, prenotare e disdire 24 ore su 24;
- ai **medici**: un'agenda sempre aggiornata e la gestione autonoma delle proprie disponibilità;
- alla **segreteria**: una vista unica di tutte le prenotazioni, con ricerca e filtri, la possibilità di
  intervenire per conto dei pazienti e un riepilogo dell'occupazione di ciascun medico.

Benefici attesi per l'organizzazione:

| Area | Beneficio |
|---|---|
| Efficienza operativa | Meno telefonate e meno lavoro manuale per la segreteria |
| Qualità del servizio | Prenotazione self-service, senza orari, da qualsiasi dispositivo |
| Affidabilità | Doppie prenotazioni impossibili per costruzione (vincolo sul database) |
| Utilizzo delle risorse | Gli orari disdetti tornano subito prenotabili da altri pazienti |
| Controllo di gestione | Indicatori di occupazione delle agende sempre disponibili |
| Integrazione | Le API REST permettono di collegare in futuro altri canali e sistemi |

### 2.4 Dati sanitari e riservatezza

Le informazioni trattate da una clinica rientrano tra le **categorie particolari di dati** dell'art. 9
del GDPR. Per questo il progetto segue alcune scelte di prudenza:

- **minimizzazione dei dati**: si salvano solo i dati necessari alla prenotazione. Il motivo della
  visita è facoltativo e non sono previsti referti o diagnosi;
- **controllo degli accessi per ruolo**: un paziente vede solo le proprie prenotazioni, un medico solo
  la propria agenda. L'elenco completo è riservato alla segreteria;
- **credenziali protette**: le password sono salvate solo come hash *bcrypt*, e l'accesso alle API
  protette richiede un token firmato con scadenza;
- **conservazione dello storico**: le prenotazioni disdette non vengono cancellate, così resta
  traccia di quanto avvenuto.

---

## 3. Analisi dei requisiti

### 3.1 Attori

| Attore | Descrizione |
|---|---|
| Visitatore | Utente non autenticato: può registrarsi come paziente e consultare il catalogo |
| Paziente | Prenota, consulta e disdice le proprie visite |
| Medico | Consulta la propria agenda, crea ed elimina le proprie disponibilità |
| Segreteria | Vede e gestisce tutte le prenotazioni, gestisce le disponibilità di tutti i medici |

Gli account di medici e segreteria sono creati dall'amministrazione della clinica (nel prototipo
con lo script `seed.py`); solo i pazienti si registrano in autonomia.

### 3.2 Requisiti funzionali

| ID | Requisito | Attore |
|---|---|---|
| RF1 | Registrazione con dati anagrafici, codice fiscale e password | Visitatore |
| RF2 | Accesso con email e password | Tutti |
| RF3 | Consultazione di specialità, medici e orari liberi | Tutti |
| RF4 | Prenotazione di un orario libero, con motivo facoltativo | Paziente |
| RF5 | Consultazione delle proprie prenotazioni (in programma e storico) | Paziente |
| RF6 | Disdetta di una visita futura; l'orario torna prenotabile | Paziente, Segreteria |
| RF7 | Agenda delle visite confermate, per giorno o da oggi in poi | Medico |
| RF8 | Creazione di disponibilità senza sovrapposizioni | Medico, Segreteria |
| RF9 | Eliminazione di una disponibilità non ancora prenotata | Medico, Segreteria |
| RF10 | Elenco di tutte le prenotazioni con ricerca e filtri | Segreteria |
| RF11 | Riepilogo con indicatori principali (dashboard) per ogni ruolo | Tutti |

### 3.3 Requisiti non funzionali

| ID | Requisito |
|---|---|
| RNF1 | **Integrità**: una sola prenotazione confermata per orario, anche con richieste simultanee |
| RNF2 | **Sicurezza**: password con hash, autenticazione con token JWT a scadenza, autorizzazione per ruolo |
| RNF3 | **Validazione** dei dati sia nel front-end, per dare subito un riscontro, sia nel back-end, dove le regole vengono applicate |
| RNF4 | **Interoperabilità**: API REST con formato JSON e documentazione OpenAPI |
| RNF5 | **Usabilità**: interfaccia guidata, messaggi di errore comprensibili, uso da smartphone |
| RNF6 | **Manutenibilità**: codice a livelli e a oggetti, test automatici |
| RNF7 | **Configurabilità**: chiave segreta e database impostabili da variabili d'ambiente |

---

## 4. Design del sistema

### 4.1 Architettura

```mermaid
flowchart LR
    subgraph Client["Client (browser)"]
        UI["Front-end React + TypeScript<br/>pagine, componenti, client API"]
    end

    subgraph Server["Back-end FastAPI (Python)"]
        direction TB
        R["Routers<br/>endpoint REST, codici HTTP"]
        D["Dependencies<br/>autenticazione JWT e ruoli"]
        S["Services<br/>regole di business"]
        P["Repositories<br/>accesso ai dati"]
        M["Models (SQLAlchemy)<br/>Schemas (Pydantic)"]
        R --> D
        R --> S --> P --> M
    end

    DB[("Database<br/>SQLite")]

    UI -- "HTTP + JSON<br/>Authorization: Bearer JWT" --> R
    M --> DB
```

Il back-end è diviso in **livelli**, ognuno con una responsabilità precisa:

- i **router** conoscono HTTP: ricevono la richiesta, verificano l'identità e il ruolo dell'utente
  e traducono gli esiti in codici di stato;
- i **servizi** contengono le regole del dominio ("non si prenota un orario già passato") e non
  dipendono da HTTP. Comunicano gli errori sollevando **eccezioni di dominio**, per esempio
  `SlotNonDisponibile`;
- i **repository** incapsulano le query al database;
- i **model** (SQLAlchemy) rappresentano le tabelle, mentre gli **schema** (Pydantic) descrivono e
  validano i dati scambiati con il client.

Questa struttura rende ogni parte sostituibile e verificabile in modo indipendente. Per esempio, i test
sostituiscono il database con uno in memoria senza modificare il codice applicativo.

### 4.2 Diagramma dei casi d'uso (UML)

![Diagramma dei casi d'uso](diagrammi/casi-uso.svg)

Come leggere il diagramma:

- *Accedere* e *Consultare la dashboard* sono comuni a tutti gli utenti autenticati: paziente,
  medico e segreteria. La dashboard mostra contenuti diversi a seconda del ruolo.
- La freccia con il triangolo vuoto è una **generalizzazione**: il Paziente è un Visitatore che si è
  registrato, quindi può fare anche tutto ciò che fa il Visitatore.
- La relazione **«include»** indica che *Prenotare una visita* comprende sempre la consultazione
  degli orari liberi.
- *Disdire una prenotazione* è condiviso: il paziente disdice le proprie visite, la segreteria
  quelle di qualunque paziente.

### 4.3 Modello dei dati (diagramma ER)

```mermaid
erDiagram
    UTENTE ||--o| PAZIENTE : "è"
    UTENTE ||--o| MEDICO : "è"
    SPECIALITA ||--o{ MEDICO : "comprende"
    MEDICO ||--o{ SLOT : "offre"
    PAZIENTE ||--o{ PRENOTAZIONE : "effettua"
    SLOT ||--o{ PRENOTAZIONE : "riguarda"

    UTENTE {
        int id PK
        string email UK
        string password_hash
        enum ruolo "paziente | medico | segreteria"
        string nome
        string cognome
        string telefono "facoltativo"
    }
    PAZIENTE {
        int id PK
        int utente_id FK, UK
        string codice_fiscale UK
        date data_nascita
    }
    MEDICO {
        int id PK
        int utente_id FK, UK
        int specialita_id FK
    }
    SPECIALITA {
        int id PK
        string nome UK
    }
    SLOT {
        int id PK
        int medico_id FK
        datetime inizio
        datetime fine
        enum stato "libero | occupato | rimosso"
    }
    PRENOTAZIONE {
        int id PK
        int paziente_id FK
        int slot_id FK
        enum stato "confermata | annullata"
        string motivo "facoltativo"
        datetime creata_il
    }
```

Scelte di modellazione principali:

- **Generalizzazione di Utente.** Le credenziali e i dati comuni stanno in `UTENTE`; `PAZIENTE` e
  `MEDICO` sono tabelle collegate 1:1 (vincolo `UNIQUE` su `utente_id`) con i dati specifici del
  ruolo. La segreteria non ha dati aggiuntivi e usa solo `UTENTE`.
- **Lo slot come unità di disponibilità.** Il medico pubblica degli *slot* (intervalli di tempo) e il
  paziente ne prenota uno. Così il catalogo degli orari liberi è una semplice query sugli slot con
  stato `libero`.
- **Uno slot, più prenotazioni nel tempo.** La relazione SLOT–PRENOTAZIONE è 1:N perché uno slot può
  essere prenotato, disdetto e prenotato di nuovo. Le prenotazioni annullate restano come storico.
  La regola "al massimo **una** prenotazione confermata per slot" è garantita da un **indice univoco
  parziale** sul database:

  ```sql
  CREATE UNIQUE INDEX uq_prenotazione_confermata_per_slot
      ON prenotazioni (slot_id) WHERE stato = 'confermata';
  ```

### 4.4 Diagramma delle classi (UML)

**Modello di dominio** (classi SQLAlchemy in `backend/app/models`):

```mermaid
classDiagram
    direction LR
    class Utente {
        +int id
        +str email
        +str password_hash
        +Ruolo ruolo
        +str nome
        +str cognome
        +str telefono
    }
    class Paziente {
        +int id
        +str codice_fiscale
        +date data_nascita
    }
    class Medico {
        +int id
        +nome() str
        +cognome() str
    }
    class Specialita {
        +int id
        +str nome
    }
    class Slot {
        +int id
        +datetime inizio
        +datetime fine
        +StatoSlot stato
    }
    class Prenotazione {
        +int id
        +StatoPrenotazione stato
        +str motivo
        +datetime creata_il
        +paziente_nome() str
        +paziente_cognome() str
    }
    class Ruolo {
        <<enumeration>>
        PAZIENTE
        MEDICO
        SEGRETERIA
    }
    class StatoSlot {
        <<enumeration>>
        LIBERO
        OCCUPATO
        RIMOSSO
    }
    class StatoPrenotazione {
        <<enumeration>>
        CONFERMATA
        ANNULLATA
    }

    Utente "1" -- "0..1" Paziente : paziente
    Utente "1" -- "0..1" Medico : medico
    Specialita "1" -- "*" Medico : medici
    Medico "1" -- "*" Slot : slot
    Paziente "1" -- "*" Prenotazione : prenotazioni
    Slot "1" -- "*" Prenotazione : prenotazioni
    Utente ..> Ruolo
    Slot ..> StatoSlot
    Prenotazione ..> StatoPrenotazione
```

**Livello applicativo** (servizi e repository): ogni servizio riceve la sessione del database e
usa uno o più repository. Le eccezioni di dominio sono classi dedicate.

```mermaid
classDiagram
    direction TB
    class PrenotazioneService {
        +prenota(utente, dati) Prenotazione
        +elenco(utente) list~Prenotazione~
        +disdici(utente, prenotazione_id) Prenotazione
    }
    class SlotService {
        +crea_slot(utente, dati) Slot
        +miei_slot(utente, giorno) list~Slot~
        +rimuovi_slot(utente, slot_id) Slot
    }
    class AgendaService {
        +agenda(utente, giorno) list~VoceAgenda~
    }
    class CatalogoService {
        +elenco_specialita() list~Specialita~
        +elenco_medici(specialita_id) list~Medico~
        +slot_liberi(medico_id, giorno) list~Slot~
    }
    class AuthService {
        +registra_paziente(dati) Utente
        +login(dati) str
    }
    class PrenotazioneRepository {
        +get_by_id(id)
        +del_paziente(paziente_id)
        +tutte()
        +agenda_medico(medico_id, giorno)
        +aggiungi(prenotazione)
        +salva()
    }
    class SlotRepository {
        +get_by_id(id)
        +liberi(medico_id, giorno)
        +del_medico(medico_id, giorno)
        +esiste_sovrapposizione(medico_id, inizio, fine) bool
        +aggiungi(slot)
        +salva(slot)
    }
    class MedicoRepository {
        +elenco(specialita_id)
        +get_by_id(id)
        +get_by_utente_id(utente_id)
    }
    class UtenteRepository {
        +get_by_id(id)
        +get_by_email(email)
        +codice_fiscale_esiste(cf) bool
        +salva_paziente(utente, paziente)
    }
    class SpecialitaRepository {
        +elenco()
    }

    PrenotazioneService --> PrenotazioneRepository
    PrenotazioneService --> SlotRepository
    SlotService --> SlotRepository
    SlotService --> MedicoRepository
    AgendaService --> MedicoRepository
    AgendaService --> PrenotazioneRepository
    CatalogoService --> SpecialitaRepository
    CatalogoService --> MedicoRepository
    CatalogoService --> SlotRepository
    AuthService --> UtenteRepository

    class SlotNonDisponibile
    <<exception>> SlotNonDisponibile
    class SlotSovrapposto
    <<exception>> SlotSovrapposto
    class OperazioneNonConsentita
    <<exception>> OperazioneNonConsentita
    PrenotazioneService ..> SlotNonDisponibile : solleva
    PrenotazioneService ..> OperazioneNonConsentita : solleva
    SlotService ..> SlotSovrapposto : solleva
```

### 4.5 Diagrammi di stato (UML)

Lo stato dello **slot** e quello della **prenotazione** cambiano insieme e sono il cuore delle regole
di business.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> libero : creazione (medico / segreteria)
    libero --> occupato : prenotazione del paziente
    occupato --> libero : disdetta della prenotazione
    libero --> rimosso : eliminazione
    rimosso --> [*]
    note right of occupato
        non eliminabile:
        va prima disdetto
    end note
```

```mermaid
stateDiagram-v2
    direction LR
    [*] --> confermata : prenotazione
    confermata --> annullata : disdetta (solo visite future)
    annullata --> [*] : resta nello storico
```

### 4.6 Diagrammi di sequenza (UML)

**Prenotazione di una visita**: comprende il caso in cui due pazienti provano a prenotare lo
stesso orario nello stesso momento.

```mermaid
sequenceDiagram
    autonumber
    actor P as Paziente
    participant FE as Front-end
    participant R as Router /prenotazioni
    participant D as richiede_ruoli
    participant S as PrenotazioneService
    participant DB as Database

    P->>FE: sceglie orario e conferma
    FE->>R: POST /prenotazioni {slot_id, motivo}<br/>Authorization: Bearer JWT
    R->>D: verifica token e ruolo "paziente"
    D-->>R: utente autenticato
    R->>S: prenota(utente, dati)
    S->>DB: legge lo slot
    alt slot inesistente
        S-->>R: SlotNonTrovato
        R-->>FE: 404 Slot non trovato
    else slot occupato o già passato
        S-->>R: SlotNonDisponibile
        R-->>FE: 409 Slot non disponibile
    else slot libero
        S->>DB: INSERT prenotazione + UPDATE slot "occupato" (una transazione)
        alt un'altra richiesta ha appena prenotato lo stesso slot
            DB-->>S: IntegrityError (indice univoco)
            S->>DB: ROLLBACK
            S-->>R: SlotNonDisponibile
            R-->>FE: 409 Slot non disponibile
        else nessun conflitto
            DB-->>S: COMMIT
            S-->>R: prenotazione con dettagli
            R-->>FE: 201 Created
            FE-->>P: elenco "Le mie prenotazioni"
        end
    end
```

**Autenticazione e chiamata protetta**: comprende la scadenza del token.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utente
    participant FE as Front-end
    participant API as Back-end
    U->>FE: email e password
    FE->>API: POST /auth/login
    API->>API: verifica hash bcrypt
    API-->>FE: 200 {access_token} (JWT firmato, scade dopo 60')
    FE->>FE: salva il token
    FE->>API: GET /auth/me (Bearer token)
    API-->>FE: profilo e ruolo
    FE-->>U: menu e dashboard del ruolo
    Note over FE,API: ...dopo la scadenza...
    FE->>API: GET /prenotazioni (token scaduto)
    API-->>FE: 401 Token non valido o scaduto
    FE->>FE: rimuove il token, disconnette l'utente
    FE-->>U: pagina di accesso con "La sessione è scaduta"
```

### 4.7 Design dell'interfaccia

Il front-end è organizzato in **pagine** (una per schermata), **componenti** riutilizzabili e un
unico **client API** (`src/api/client.ts`) che concentra tutte le chiamate al back-end. Le rotte
sono protette per ruolo dal componente `RottaProtetta`.

| Percorso | Pagina | Ruolo |
|---|---|---|
| `/login`, `/registrazione` | Accesso e registrazione | Pubblico |
| `/` | Dashboard (diversa per ogni ruolo) | Tutti gli autenticati |
| `/prenota` | Prenotazione guidata in 4 passi | Paziente |
| `/prenotazioni` | Le mie prenotazioni (in programma / storico) | Paziente |
| `/agenda` | Agenda e disponibilità | Medico |
| `/segreteria` | Gestione clinica | Segreteria |

Principi seguiti:

- **colpo d'occhio**: ogni ruolo trova subito nella home i numeri che gli servono (prossima visita,
  visite di oggi, occupazione delle agende);
- **percorso guidato**: la prenotazione procede per passi (specialità → medico → orario → conferma)
  e mostra solo orari realmente disponibili;
- **riscontro immediato**: ogni errore del back-end è mostrato con il suo messaggio (per esempio
  "Slot non disponibile"), e le liste si aggiornano dopo ogni operazione;
- **responsive**: il layout si adatta allo smartphone.

---

## 5. Documentazione delle API

### 5.1 Swagger / OpenAPI

FastAPI genera automaticamente la specifica **OpenAPI 3** a partire dal codice: i tipi dei parametri,
gli schema Pydantic e le docstring degli endpoint. Con il back-end avviato, la documentazione è
consultabile e provabile su:

- **Swagger UI**: <http://127.0.0.1:8000/docs>
- **ReDoc**: <http://127.0.0.1:8000/redoc>

Una copia statica della specifica è salvata nel repository in [`docs/api/openapi.json`](api/openapi.json).
Si può importare in Postman, in Swagger Editor o in un generatore di client, e si rigenera con
`python esporta_openapi.py`.

Oltre alle risposte positive, per ogni endpoint sono documentati i **possibili errori**, con
descrizione e schema (funzione `errori()` in `app/schemas/errore.py`).

![Swagger UI: elenco delle API](screenshots/f10a_swagger.png)

![Swagger UI: dettaglio di POST /prenotazioni con le risposte di errore](screenshots/f10b_swagger_prenotazione.png)

### 5.2 Autenticazione

1. Il client chiama `POST /auth/login` con email e password.
2. Il server restituisce un **JWT** firmato (HS256) che contiene l'id e il ruolo dell'utente e scade
   dopo 60 minuti.
3. Le chiamate protette inviano l'intestazione `Authorization: Bearer <token>`.
4. Se il token manca o è scaduto la risposta è **401**; se il ruolo non è ammesso è **403**.

### 5.3 Elenco degli endpoint

| Metodo | Percorso | Accesso | Descrizione | Esiti |
|---|---|---|---|---|
| POST | `/auth/register` | pubblico | Registra un paziente | 201, 409, 422 |
| POST | `/auth/login` | pubblico | Restituisce il token JWT | 200, 401 |
| GET | `/auth/me` | autenticato | Profilo dell'utente | 200, 401 |
| GET | `/specialita` | pubblico | Elenco delle specialità | 200 |
| GET | `/medici?specialita_id=` | pubblico | Medici, filtrabili per specialità | 200 |
| GET | `/medici/{id}/slot?data=` | pubblico | Slot liberi futuri di un medico | 200, 404 |
| POST | `/prenotazioni` | paziente | Prenota uno slot | 201, 401, 403, 404, 409 |
| GET | `/prenotazioni` | paziente, segreteria | Proprie prenotazioni / tutte | 200, 401, 403 |
| DELETE | `/prenotazioni/{id}` | paziente, segreteria | Disdice una prenotazione | 200, 401, 403, 404, 409 |
| GET | `/medici/me/agenda?data=` | medico | Visite confermate del medico | 200, 401, 403, 404 |
| GET | `/medici/me/slot?data=` | medico | Disponibilità del medico | 200, 401, 403, 404 |
| POST | `/slot` | medico, segreteria | Crea una disponibilità | 201, 401, 403, 404, 409, 422 |
| DELETE | `/slot/{id}` | medico, segreteria | Elimina una disponibilità libera | 200, 401, 403, 404, 409 |
| GET | `/health` | pubblico | Stato del servizio | 200 |

Scelte REST adottate:

- **risorse al plurale** e **metodi HTTP standard**: `POST` crea, `GET` legge, `DELETE` rimuove;
- **`/me`** per le risorse dell'utente autenticato (`/auth/me`, `/medici/me/agenda`). Il client non
  deve conoscere il proprio id, e un medico non può leggere l'agenda di un collega;
- **la disdetta è un `DELETE`** sulla prenotazione, ma la risorsa non viene cancellata: passa allo
  stato `annullata` e viene restituita nella risposta;
- **codici di stato significativi**: `201` per le creazioni, `409 Conflict` per le violazioni delle
  regole di business (orario occupato, sovrapposizioni, disdetta ripetuta), `422` per i dati non
  validi;
- **errori uniformi**: sempre `{"detail": "messaggio leggibile"}`, mostrato così com'è nell'interfaccia.

### 5.4 Esempio di chiamata

Richiesta:

```http
POST /prenotazioni HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{ "slot_id": 2, "motivo": "Controllo della pressione" }
```

Risposta `201 Created`:

```json
{
  "id": 1,
  "paziente_id": 1,
  "stato": "confermata",
  "motivo": "Controllo della pressione",
  "creata_il": "2026-11-15T10:46:43",
  "slot": {
    "id": 2,
    "medico_id": 1,
    "inizio": "2026-11-16T09:30:00",
    "fine": "2026-11-16T10:00:00",
    "stato": "occupato",
    "medico": {
      "id": 1,
      "nome": "Luca",
      "cognome": "Bianchi",
      "specialita": { "id": 1, "nome": "Cardiologia" }
    }
  },
  "paziente_nome": "Mario",
  "paziente_cognome": "Rossi"
}
```

Se lo stesso slot viene richiesto di nuovo, la risposta è `409 Conflict`:

```json
{ "detail": "Slot non disponibile" }
```

---

## 6. Il processo di sviluppo

### 6.1 Metodo

Lo sviluppo è stato **incrementale**: ogni passo ha aggiunto una funzionalità completa e verificata
(modello, logica, endpoint e test), registrata con un commit Git. Il back-end è stato sviluppato per
primo e verificato tramite Swagger e test automatici. Il front-end è stato costruito sopra API già
stabili.

### 6.2 Fasi

La cronologia ricostruita dai commit del repository:

| Data | Commit | Contenuto |
|---|---|---|
| 26/10/2026 | Scheletro del backend FastAPI | Struttura a livelli, connessione al database, endpoint `/health` |
| 26/10/2026 | Modelli SQLAlchemy delle sei entità | Entità, relazioni ed enumerazioni del diagramma ER |
| 26/10/2026 | Registrazione, login e autenticazione JWT | Hash bcrypt, token JWT, dipendenze per utente e ruolo |
| 26/10/2026 | Catalogo e creazione slot | Specialità, medici, slot liberi, controllo delle sovrapposizioni |
| 02/11/2026 | Prenotazione e disdetta con controllo anti-doppia prenotazione | Indice univoco parziale, transazione, storico delle disdette |
| 02/11/2026 | Agenda del medico e CORS | Agenda del medico, abilitazione del front-end sulla porta 5173 |
| 02/11/2026 | Front-end: progetto React, login e registrazione | Progetto Vite, client API, contesto di autenticazione, rotte protette |
| 02/11/2026 | Nascondi gli slot già trascorsi | Correzione: gli orari passati non sono mai prenotabili |
| 02/11/2026 | Agenda del medico e gestione della segreteria | Pagine del medico e della segreteria |
| 15/11/2026 | Validazione, configurazione da .env e gestione delle disponibilità | Codice fiscale, slot nel passato, eliminazione logica degli slot, configurazione |
| 15/11/2026 | Nuova interfaccia: dashboard per ruolo e prenotazione guidata | Redesign dell'interfaccia, dashboard, scadenza della sessione |
| 15/11/2026 | README con architettura, modello dei dati e istruzioni di avvio | Documentazione |

### 6.3 Strumenti

| Ambito | Strumenti |
|---|---|
| Back-end | Python 3.13, FastAPI, SQLAlchemy 2, Pydantic 2, PyJWT, bcrypt, Uvicorn |
| Front-end | React 19, TypeScript, React Router, Vite |
| Database | SQLite (sostituibile tramite `DATABASE_URL`) |
| Test | pytest, TestClient di FastAPI, Chrome headless per i test funzionali |
| Qualità | ESLint, compilatore TypeScript |
| Sviluppo | Visual Studio Code, Git, Swagger UI |
| Assistenza | Claude Code (assistente di programmazione basato su IA), usato per revisione del codice, refactoring, test e supporto alla documentazione |

### 6.4 Problemi affrontati

- **Doppie prenotazioni concorrenti.** Il controllo "lo slot è libero?" nel servizio non basta: due
  richieste simultanee possono superarlo entrambe prima che una delle due salvi. La soluzione è stata
  spostare la garanzia nel database con un indice univoco parziale (vedi snippet 7.1).
- **Storico contro vincolo di unicità.** Un normale vincolo `UNIQUE(slot_id)` avrebbe impedito di
  riprenotare uno slot disdetto. L'indice **parziale**, limitato alle prenotazioni confermate,
  permette di conservare lo storico e insieme garantire l'unicità.
- **Eliminazione di slot con storico.** Cancellare fisicamente uno slot avrebbe lasciato prenotazioni
  annullate senza slot, rompendo l'elenco della segreteria. Si è adottata una **cancellazione
  logica** (snippet 7.5), verificata da un test dedicato.
- **Ordine delle rotte.** La rotta `/medici/me/slot` veniva intercettata da `/medici/{medico_id}/slot`
  con `medico_id = "me"`, restituendo un errore 422. Il router dell'agenda è stato registrato prima di
  quello del catalogo.
- **Fusi orari.** Gli orari degli slot sono salvati in ora locale senza fuso, perché la clinica ha una
  sola sede. Il front-end invia le date nello stesso formato (`isoLocale()` in `utils.ts`), così si
  evitano spostamenti di un'ora tra browser e server.
- **Sessione scaduta.** Inizialmente, alla scadenza del token l'utente restava "a metà" e vedeva
  solo messaggi d'errore. Il client API ora intercetta il 401 e disconnette l'utente (snippet 7.6).

---

## 7. Snippet di codice significativi

### 7.1 Nessuna doppia prenotazione: vincolo sul database e transazione

Il modello dichiara un indice univoco **parziale**: è univoco `slot_id`, ma solo tra le prenotazioni
`confermata`.

```python
# backend/app/models/prenotazione.py
class Prenotazione(Base):
    __tablename__ = "prenotazioni"
    __table_args__ = (
        # Al massimo una prenotazione CONFERMATA per slot: quelle annullate
        # restano come storico e non violano il vincolo.
        Index(
            "uq_prenotazione_confermata_per_slot",
            "slot_id",
            unique=True,
            sqlite_where=text("stato = 'confermata'"),
            postgresql_where=text("stato = 'confermata'"),
        ),
    )
```

Il servizio fa un primo controllo, che copre il caso comune e dà un errore chiaro, poi salva
prenotazione e cambio di stato dello slot in **un'unica transazione**. Se nel frattempo un'altra
richiesta ha prenotato lo stesso slot, il database rifiuta il salvataggio e l'errore viene tradotto
nello stesso `SlotNonDisponibile`:

```python
# backend/app/services/prenotazione_service.py
def prenota(self, utente: Utente, dati: PrenotazioneCreate) -> Prenotazione:
    slot = self.slot.get_by_id(dati.slot_id)
    if slot is None:
        raise SlotNonTrovato()
    if slot.stato != StatoSlot.LIBERO or slot.inizio <= datetime.now():
        raise SlotNonDisponibile()

    prenotazione = Prenotazione(
        paziente_id=utente.paziente.id,
        slot_id=slot.id,
        motivo=dati.motivo,
        stato=StatoPrenotazione.CONFERMATA,
    )
    slot.stato = StatoSlot.OCCUPATO

    try:
        # Un'unica transazione: nuova prenotazione + slot occupato.
        # Se due richieste arrivano insieme, l'indice univoco del database
        # fa fallire la seconda con IntegrityError.
        self.prenotazioni.aggiungi(prenotazione)
    except IntegrityError:
        self.db.rollback()
        raise SlotNonDisponibile()

    return self.prenotazioni.get_by_id(prenotazione.id)
```

La regola è verificata anche **aggirando il servizio**: il test
`test_il_database_impedisce_due_prenotazioni_confermate_sullo_stesso_slot` inserisce due prenotazioni
confermate direttamente nel database e si aspetta l'`IntegrityError`.

### 7.2 Autorizzazione per ruolo con una dependency di FastAPI

`richiede_ruoli` è una **funzione che costruisce una dependency**: riceve i ruoli ammessi e
restituisce una funzione che FastAPI esegue prima dell'endpoint. Questa a sua volta dipende da
`get_utente_corrente`, che decodifica il JWT.

```python
# backend/app/dependencies.py
def richiede_ruoli(*ruoli: Ruolo):
    def verifica(utente: Utente = Depends(get_utente_corrente)) -> Utente:
        if utente.ruolo not in ruoli:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permessi insufficienti",
            )
        return utente

    return verifica
```

L'endpoint dichiara i ruoli ammessi in una riga, e riceve direttamente l'utente già verificato:

```python
# backend/app/routers/prenotazioni.py
@router.delete("/{prenotazione_id}", response_model=PrenotazioneOut, ...)
def disdici(
    prenotazione_id: int,
    utente: Utente = Depends(richiede_ruoli(Ruolo.PAZIENTE, Ruolo.SEGRETERIA)),
    db: Session = Depends(get_db),
):
```

Il controllo sul ruolo, che decide chi può chiamare l'endpoint, sta quindi nel router. Il controllo
sulla proprietà dei dati ("un paziente disdice solo le proprie prenotazioni") sta invece nel servizio,
perché è una regola di business.

### 7.3 Eccezioni di dominio tradotte in codici HTTP

I servizi non conoscono HTTP: segnalano gli esiti con eccezioni dal nome parlante. Il router le
traduce in risposte. Ne risultano servizi riutilizzabili (per esempio da uno script o da un'altra
interfaccia) e codice leggibile.

```python
# backend/app/routers/prenotazioni.py
    try:
        return PrenotazioneService(db).disdici(utente, prenotazione_id)
    except PrenotazioneNonTrovata:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prenotazione non trovata")
    except OperazioneNonConsentita:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Non puoi disdire la prenotazione di un altro paziente")
    except PrenotazioneGiaAnnullata:
        raise HTTPException(status.HTTP_409_CONFLICT, "Prenotazione già annullata")
    except VisitaGiaPassata:
        raise HTTPException(status.HTTP_409_CONFLICT, "La visita è già passata")
```

### 7.4 Validazione dichiarativa con Pydantic

Lo schema di registrazione dichiara i vincoli sui campi (lunghezze, formato email) e due validatori
personalizzati. Se un vincolo non è rispettato FastAPI risponde `422` senza eseguire l'endpoint.

```python
# backend/app/schemas/auth.py
CIFRA = "[0-9LMNPQRSTUV]"
FORMATO_CODICE_FISCALE = re.compile(
    rf"^[A-Z]{{6}}{CIFRA}{{2}}[ABCDEHLMPRST]{CIFRA}{{2}}[A-Z]{CIFRA}{{3}}[A-Z]$"
)

class RegistrazionePaziente(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    codice_fiscale: str = Field(min_length=16, max_length=16)
    data_nascita: date
    # ...

    @field_validator("codice_fiscale")
    @classmethod
    def codice_fiscale_valido(cls, valore: str) -> str:
        valore = valore.strip().upper()
        if not FORMATO_CODICE_FISCALE.match(valore):
            raise ValueError("Formato del codice fiscale non valido")
        return valore
```

L'espressione regolare segue la struttura del codice fiscale: cognome, nome, anno, mese (una delle
12 lettere ammesse), giorno e sesso, comune, carattere di controllo. Nelle posizioni numeriche accetta
anche le lettere usate per l'**omocodia**. Lo stesso controllo è replicato nel front-end per dare un
riscontro immediato, ma è il back-end a farlo rispettare.

### 7.5 Cancellazione logica di una disponibilità

Uno slot libero può avere nello storico prenotazioni annullate. Per non perderle, l'eliminazione
cambia lo stato in `rimosso` invece di cancellare la riga. Gli slot rimossi sono esclusi dal catalogo
e dal controllo delle sovrapposizioni.

```python
# backend/app/services/slot_service.py
def rimuovi_slot(self, utente: Utente, slot_id: int) -> Slot:
    slot = self.slot.get_by_id(slot_id)
    if slot is None or slot.stato == StatoSlot.RIMOSSO:
        raise SlotNonTrovato()
    if utente.ruolo == Ruolo.MEDICO and slot.medico_id != self._medico_di(utente).id:
        raise MedicoNonAutorizzato()
    # Uno slot prenotato va prima disdetto: il paziente non deve perdere la visita in silenzio
    if slot.stato != StatoSlot.LIBERO:
        raise SlotNonEliminabile()

    slot.stato = StatoSlot.RIMOSSO
    return self.slot.salva(slot)
```

### 7.6 Front-end: client API unico e gestione della sessione scaduta

Tutte le chiamate passano da una sola funzione generica `richiesta<T>()`. Questa aggiunge il token,
gestisce gli errori in modo uniforme e, se il server rifiuta il token, avvisa il contesto di
autenticazione.

```typescript
// frontend/src/api/client.ts
async function richiesta<T>(percorso: string, opzioni: RequestInit = {}): Promise<T> {
  const headers = new Headers(opzioni.headers);
  headers.set("Content-Type", "application/json");
  const token = leggiToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const risposta = await fetch(`${BASE_URL}${percorso}`, { ...opzioni, headers });

  if (risposta.status === 401 && token && percorso !== "/auth/login") {
    rimuoviToken();
    gestoreTokenRifiutato?.();   // il contesto azzera l'utente
  }

  if (!risposta.ok) {
    // il messaggio "detail" del back-end diventa il messaggio mostrato all'utente
    ...
    throw new ErroreApi(risposta.status, messaggio);
  }
  return risposta.json() as Promise<T>;
}
```

Quando il contesto azzera l'utente, il componente `RottaProtetta` riporta alla pagina di accesso.
Lo stesso componente impedisce a un ruolo di aprire le pagine di un altro:

```tsx
// frontend/src/components/RottaProtetta.tsx
export default function RottaProtetta({ ruoli }: { ruoli?: Ruolo[] }) {
  const { utente, caricamento } = useAuth();

  if (caricamento) return <p style={{ padding: "1rem" }}>Caricamento…</p>;
  if (!utente) return <Navigate to="/login" replace />;
  if (ruoli && !ruoli.includes(utente.ruolo)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

La protezione nel front-end serve all'esperienza d'uso. La sicurezza vera resta nel back-end, che
rifiuta comunque con `403` le chiamate di un ruolo non ammesso (verificato nel flusso F8).

---

## 8. Test

### 8.1 Test automatici del back-end

Il back-end ha **30 test automatici** (pytest), che chiamano le API attraverso il `TestClient` di
FastAPI. Ogni test usa un **database SQLite in memoria nuovo**, ottenuto sostituendo la dependency
`get_db`, e parte da uno scenario controllato (un medico, una segreteria, due slot liberi per domani).

| File | Test | Cosa verificano |
|---|---|---|
| `test_auth.py` | 9 | Registrazione, login, profilo; email e codice fiscale duplicati; password corta; formato del codice fiscale; data di nascita futura |
| `test_prenotazioni.py` | 7 | Prenotazione; doppia prenotazione (stesso paziente e paziente diverso); disdetta e storico; permessi; vincolo sul database |
| `test_disponibilita.py` | 7 | Disponibilità del medico; eliminazione logica; slot prenotato non eliminabile; storico preservato; permessi tra colleghi |
| `test_agenda.py` | 3 | Agenda con le visite confermate, esclusione delle annullate, accesso vietato ai pazienti |
| `test_segreteria.py` | 3 | Nome del paziente visibile alla segreteria; creazione di slot per un medico; slot nel passato rifiutati |
| `test_slot_passati.py` | 1 | Gli orari già trascorsi non compaiono mai tra quelli prenotabili |

Esecuzione (`cd backend && pytest -v`):

```text
tests/test_agenda.py::test_agenda_mostra_le_visite_confermate_del_medico PASSED
tests/test_agenda.py::test_agenda_esclude_le_prenotazioni_annullate PASSED
tests/test_agenda.py::test_agenda_vietata_ai_pazienti PASSED
tests/test_auth.py::test_registrazione_login_e_profilo PASSED
tests/test_auth.py::test_email_gia_registrata PASSED
tests/test_auth.py::test_codice_fiscale_gia_registrato PASSED
tests/test_auth.py::test_login_con_password_errata PASSED
tests/test_auth.py::test_profilo_senza_token_rifiutato PASSED
tests/test_auth.py::test_password_troppo_corta PASSED
tests/test_auth.py::test_codice_fiscale_con_formato_errato PASSED
tests/test_auth.py::test_codice_fiscale_salvato_in_maiuscolo PASSED
tests/test_auth.py::test_data_di_nascita_futura PASSED
tests/test_disponibilita.py::test_il_medico_vede_le_proprie_disponibilita_libere_e_prenotate PASSED
tests/test_disponibilita.py::test_il_medico_elimina_uno_slot_libero PASSED
tests/test_disponibilita.py::test_uno_slot_prenotato_non_si_elimina PASSED
tests/test_disponibilita.py::test_slot_liberato_da_una_disdetta_si_puo_eliminare PASSED
tests/test_disponibilita.py::test_il_medico_non_elimina_gli_slot_di_un_collega PASSED
tests/test_disponibilita.py::test_il_paziente_non_elimina_slot PASSED
tests/test_disponibilita.py::test_dopo_la_rimozione_l_orario_torna_disponibile PASSED
tests/test_prenotazioni.py::test_prenota_slot_libero PASSED
tests/test_prenotazioni.py::test_stesso_paziente_non_puo_prenotare_due_volte_lo_slot PASSED
tests/test_prenotazioni.py::test_altro_paziente_non_puo_prenotare_slot_occupato PASSED
tests/test_prenotazioni.py::test_disdetta_libera_lo_slot_e_conserva_lo_storico PASSED
tests/test_prenotazioni.py::test_paziente_non_puo_disdire_prenotazione_altrui PASSED
tests/test_prenotazioni.py::test_medico_non_puo_prenotare PASSED
tests/test_prenotazioni.py::test_il_database_impedisce_due_prenotazioni_confermate_sullo_stesso_slot PASSED
tests/test_segreteria.py::test_la_segreteria_vede_il_nome_del_paziente PASSED
tests/test_segreteria.py::test_la_segreteria_crea_slot_per_un_medico PASSED
tests/test_segreteria.py::test_non_si_creano_slot_nel_passato PASSED
tests/test_slot_passati.py::test_gli_slot_passati_non_vengono_mostrati PASSED
============================= 30 passed in 21.37s =============================
```

Per il front-end, l'analisi statica (`npm run lint`) e il controllo dei tipi TypeScript
(`npm run build`) non segnalano errori.

### 8.2 Test funzionale dell'applicazione

Il test funzionale ripercorre i flussi principali dal punto di vista dell'utente, su un database
nuovo popolato con `seed.py`. I passi sono stati eseguiti in un browser (Chrome) e documentati con
uno screenshot ciascuno. Tutti i dati personali sono fittizi.

| ID | Flusso | Esito atteso | Esito |
|---|---|---|---|
| F1 | Accesso con password errata | Messaggio "Credenziali non valide" | ✅ |
| F2 | Registrazione di un paziente, prima con codice fiscale errato | Errore sul codice fiscale, poi registrazione e accesso automatico | ✅ |
| F3 | Prenotazione guidata | Prenotazione confermata e visibile tra le proprie | ✅ |
| F4 | Due pazienti scelgono lo stesso orario | Il secondo riceve "Slot non disponibile" | ✅ |
| F5 | Dashboard e disdetta del paziente | La visita passa nello storico come annullata | ✅ |
| F6 | Agenda del medico, nuova disponibilità, sovrapposizione | Slot aggiunto; il secondo, uguale, viene rifiutato | ✅ |
| F7 | Dashboard e ricerca della segreteria | Occupazione per medico; filtro per nome del paziente | ✅ |
| F8 | Un paziente prova ad accedere all'agenda del medico | Interfaccia: rimandato alla home; API: `403 Permessi insufficienti` | ✅ |
| F9 | Uso da smartphone | Layout adattato allo schermo | ✅ |
| F10 | Documentazione Swagger | Elenco delle API e dettaglio delle risposte | ✅ |

#### F1 · Accesso con credenziali errate

Il back-end risponde `401` e l'interfaccia mostra il messaggio ricevuto.

![F1 - Login con password errata](screenshots/f1_login_errato.png)

#### F2 · Registrazione di un paziente

Con un codice fiscale incompleto la registrazione viene bloccata già nel browser:

![F2a - Codice fiscale non valido](screenshots/f2a_registrazione_cf_errato.png)

Con i dati corretti:

![F2b - Modulo di registrazione compilato](screenshots/f2b_registrazione_compilata.png)

Dopo la registrazione il paziente accede automaticamente e vede la propria dashboard, ancora vuota:

![F2c - Dashboard del nuovo paziente](screenshots/f2c_home_paziente_nuovo.png)

#### F3 · Prenotazione guidata

Passo 1: scelta della specialità.

![F3a - Scelta della specialità](screenshots/f3a_prenota_specialita.png)

Passi 2 e 3: scelta del medico. Compaiono gli orari liberi, raggruppati per giorno.

![F3b - Medico e orari disponibili](screenshots/f3b_prenota_medico_e_orari.png)

Passo 4: riepilogo con il motivo della visita.

![F3c - Riepilogo della prenotazione](screenshots/f3c_prenota_riepilogo.png)

Dopo la conferma la visita compare tra le prenotazioni in programma:

![F3d - Prenotazione confermata](screenshots/f3d_prenotazione_confermata.png)

#### F4 · Tentativo di doppia prenotazione

Una paziente seleziona un orario. Prima che confermi, lo stesso orario viene prenotato da un altro
paziente. Alla conferma il back-end risponde `409` e l'interfaccia mostra l'errore e aggiorna gli
orari disponibili.

![F4 - Doppia prenotazione rifiutata](screenshots/f4_doppia_prenotazione_rifiutata.png)

#### F5 · Dashboard e disdetta del paziente

![F5a - Dashboard del paziente con la prossima visita](screenshots/f5a_home_paziente.png)

Dopo la disdetta la visita è nello storico, con stato *annullata*, e l'orario torna prenotabile:

![F5b - Prenotazione disdetta nello storico](screenshots/f5b_disdetta_storico.png)

#### F6 · Medico: agenda e disponibilità

![F6a - Dashboard del medico](screenshots/f6a_home_medico.png)

L'agenda elenca le visite prenotate e le disponibilità. Gli orari liberi sono in azzurro, con la ×
per eliminarli; quelli prenotati sono in verde.

![F6b - Agenda del medico](screenshots/f6b_agenda_medico.png)

Aggiunta di una disponibilità (martedì alle 15:00), che compare subito nell'elenco:

![F6c - Disponibilità aggiunta](screenshots/f6c_slot_aggiunto.png)

Ripetendo la stessa richiesta, il back-end la rifiuta per sovrapposizione (`409`):

![F6d - Disponibilità sovrapposta rifiutata](screenshots/f6d_slot_sovrapposto.png)

#### F7 · Segreteria

La dashboard mostra le visite di oggi e della settimana, le disdette e l'occupazione delle agende di
ogni medico:

![F7a - Dashboard della segreteria](screenshots/f7a_home_segreteria.png)

Elenco delle prenotazioni filtrato per nome del paziente:

![F7b - Ricerca di un paziente](screenshots/f7b_segreteria_ricerca.png)

#### F8 · Controllo degli accessi

Un paziente autenticato che apre l'indirizzo `/agenda` viene rimandato alla propria home. Chiamando
direttamente l'API con il suo token, il back-end risponde:

```text
GET /medici/me/agenda  (token di un paziente)
→ 403 {"detail": "Permessi insufficienti"}
```

#### F9 · Uso da smartphone

<p>
  <img src="screenshots/f9a_mobile_home_paziente.png" alt="F9a - Dashboard su smartphone" width="300">
  &nbsp;
  <img src="screenshots/f9b_mobile_prenotazioni.png" alt="F9b - Prenotazioni su smartphone" width="300">
</p>

#### F10 · Documentazione Swagger

Vedi gli screenshot nel [paragrafo 5.1](#51-swagger--openapi).

---

## 9. Repository del codice

Il codice sorgente di front-end e back-end è disponibile nel repository Git:

**<https://github.com/Lelemurcielago/clinica-prenotazioni>**

Struttura:

```text
clinica-prenotazioni/
├── backend/                 API REST in Python (FastAPI)
│   ├── app/
│   │   ├── models/          entità SQLAlchemy (diagramma ER)
│   │   ├── schemas/         modelli Pydantic di input/output
│   │   ├── repositories/    accesso ai dati
│   │   ├── services/        regole di business
│   │   ├── routers/         endpoint REST
│   │   ├── dependencies.py  autenticazione e ruoli
│   │   ├── security.py      hash delle password e token JWT
│   │   ├── config.py        configurazione da variabili d'ambiente
│   │   └── main.py          applicazione FastAPI
│   ├── tests/               test automatici (pytest)
│   ├── seed.py              dati di prova
│   └── esporta_openapi.py   esportazione della specifica OpenAPI
├── frontend/                interfaccia React + TypeScript (Vite)
│   └── src/
│       ├── api/             client delle API
│       ├── auth/            contesto di autenticazione
│       ├── components/      componenti riutilizzabili
│       └── pages/           pagine dell'applicazione
├── docs/
│   ├── rapporto.md          questo documento
│   ├── api/openapi.json     specifica OpenAPI
│   └── screenshots/         test funzionale
└── README.md                istruzioni di installazione e avvio
```

Le istruzioni per installare e avviare il progetto, con gli account di prova, sono nel
[README](../README.md).

---

## 10. Conclusioni e sviluppi futuri

Il progetto ha prodotto un'applicazione completa e funzionante che digitalizza il processo di
prenotazione di un poliambulatorio. Gli obiettivi della traccia sono raggiunti:

- **front-end** web moderno in React + TypeScript, con interfaccia guidata, dashboard per ruolo e
  supporto agli smartphone;
- **back-end** API RESTful in Python, **orientato agli oggetti** (entità, servizi, repository ed
  eccezioni come classi) e organizzato a livelli;
- **documentazione** OpenAPI/Swagger generata dal codice ed esportata nel repository;
- **affidabilità** verificata da 30 test automatici e da un test funzionale completo.

Dal punto di vista dell'organizzazione, il sistema riduce il carico della segreteria, rende le
prenotazioni disponibili a qualsiasi ora, elimina per costruzione le doppie prenotazioni e offre
indicatori immediati sull'uso delle agende.

### Limiti e sviluppi futuri

- **Notifiche**: promemoria via email o SMS prima della visita, per ridurre le mancate presentazioni,
  e avviso al paziente quando la segreteria disdice la sua prenotazione.
- **Gestione degli account**: recupero della password, modifica del profilo e area di amministrazione
  per creare medici e specialità.
- **Database e migrazioni**: passaggio a PostgreSQL (l'indice univoco parziale è già definito anche
  per questo database) e gestione dello schema con Alembic.
- **Disponibilità ricorrenti**: creazione di slot su base settimanale invece che uno alla volta.
- **Ricerca lato server**: filtri e paginazione delle prenotazioni nel back-end, utili quando i
  volumi crescono.
- **Integrazioni**: grazie all'architettura API-based, collegamento con il fascicolo sanitario, con
  un sistema di pagamento o con un'app mobile che usi le stesse API.
- **Test del front-end**: test dei componenti (Vitest, Testing Library) e test end-to-end automatici
  (Playwright).
