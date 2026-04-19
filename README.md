# LeaveFlow Demo

Demo web mobile-first per la gestione ferie:

- richiesta ferie dipendente con calcolo automatico dei giorni lavorativi
- dashboard admin con metriche chiave
- approvazione o rifiuto delle richieste pendenti
- storico con filtri per stato, dipendente e periodo
- vista team con quota annuale, utilizzo e barra di progresso
- export CSV per HR
- toggle ruolo `Dipendente / Admin` per la demo

## Avvio locale

Apri [index.html](./index.html) direttamente nel browser.

## Pubblicazione su GitHub Pages

Questa app e` statica, quindi puo` essere pubblicata senza build.

1. Crea un repository su GitHub.
2. Carica questi file nella root del repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
   - `README.md`
3. Fai `commit` e `push` sul branch principale, di solito `main`.
4. Su GitHub vai in `Settings` -> `Pages`.
5. In `Build and deployment`, scegli `Deploy from a branch`.
6. Seleziona:
   - branch: `main`
   - folder: `/(root)`
7. Salva.

Dopo la pubblicazione, il sito sara` disponibile a un URL simile a:

`https://TUO-USERNAME.github.io/NOME-REPOSITORY/`

## Note

- I dati demo vengono salvati in `localStorage`, quindi restano nel browser del dispositivo che usa la demo.
- Non c'e` ancora un backend condiviso: approvazioni e richieste non si sincronizzano tra utenti diversi.
- Per un uso reale in azienda, il passo successivo e` collegare un database o un backend serverless.
