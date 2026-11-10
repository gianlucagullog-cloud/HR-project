# Marathonbet Leave Control

Portale HR per gestione ferie, permessi e malattie.
Stack: **HTML + CSS + JS statico** sul frontend, **Supabase** (Auth + Postgres + RLS) sul backend, deploy via **Vercel** o **GitHub Pages**.

## Novità rispetto alla versione precedente

- Registrazione autonoma degli utenti (signup) con **approvazione admin obbligatoria**.
- Nuova vista admin **Utenti**: approva/rifiuta registrazioni, cambia ruolo, modifica quote, disattiva account.
- UI ridisegnata: navigazione singola, palette professionale, rimossi residui del template "sports betting".
- Quota ferie annuale di default: **33 giorni**.
- Badge di notifica con conteggio richieste in attesa e utenti da approvare.
- Chip "quota residua" nella pagina Nuova richiesta.

## Setup Supabase (una tantum)

1. Apri il tuo progetto su [supabase.com](https://supabase.com).
2. Vai su **SQL Editor → New query**.
3. Copia il contenuto di `supabase_setup.sql` ed esegui.
4. (Opzionale, consigliato in dev) Vai su **Authentication → Providers → Email** e **disattiva** "Confirm email" se vuoi che gli utenti possano loggarsi subito dopo il signup senza verificare l'email. In produzione lasciala attiva.

### Creare il primo admin

1. Registrati dal portale con la tua email.
2. Torna nel SQL Editor di Supabase e lancia:
   ```sql
   update public.profiles
      set role = 'admin', status = 'active'
    where email = 'TUA_EMAIL@azienda.com';
   ```
3. Ricarica il portale e accedi: vedrai la Dashboard HR completa.
4. Da quel momento approvi gli altri utenti dal tab **Utenti**.

## Schede dipendente e simulazione busta paga

Tab **Dipendenti** (solo admin). Per ogni dipendente attivo:

- **Dati contrattuali**: ruolo, dipartimento, data inizio contratto, salario annuo lordo, daily rate (calcolabile da salario ÷ 260 gg), quota ferie, note.
- **Saldo ferie** automatico per l'anno: totale spettante (pro-rata dal mese di inizio contratto), godute, in attesa, residue.
- **Simulazione busta paga** mensile (importi lordi): daily rate × giorni lavorati (giorni lavorativi lun–ven − ferie, permessi e malattia approvati), più voci bonus **Ferie pagate** (giorni × daily rate) e **Rimborso** (importo libero). Stampabile.

- **Saldo ferie su anno solare** (1 gennaio – 31 dicembre, nessun riporto): pulsanti *Azzera godute* (riparte solo il contatore, richieste e fatture invariate; annullabile) e *Azzera in attesa* (rifiuta le richieste di ferie pendenti).
- **Validazione mensile**: *Valida importo* congela l'importo del mese (tabella `payslip_validations`); il mese non è più modificabile finché non annulli la validazione.
- **Fatturato**: tabella mesi dell'anno (simulato / validato / stato), totale validato nell'anno, da validare, totale complessivo.
- Il daily rate = salario annuo ÷ giorni lavorativi dell'anno: con tutte le ferie della quota godute, l'anno vale esattamente il salario annuo.

Setup una tantum: esegui `supabase_payroll.sql` e poi `supabase_validations.sql` nel SQL Editor (crea `employee_pay` e `payslip_items`, visibili solo agli admin, e blocca la modifica di ruolo/stato/quota da parte dei non-admin).

## Deploy

### Vercel (consigliato)
Il repository è già collegato a Vercel. Ogni push su `main` fa il deploy.

### GitHub Pages
1. `Settings → Pages → Build and deployment → Deploy from a branch → main /(root)`.
2. Il file `.nojekyll` disabilita il processing Jekyll.

## File

| File | Descrizione |
|---|---|
| `index.html`        | Markup unico della SPA (login, signup, pending, app) |
| `styles.css`        | Design system del portale |
| `app.js`            | Logica client, integrazione Supabase |
| `supabase_setup.sql`| Schema DB, trigger e RLS |
| `supabase_payroll.sql`| Tabelle schede dipendente / payslip + fix sicurezza profili |
| `supabase_validations.sql`| Azzeramento ferie e validazione mesi fatturati |
| `.nojekyll`         | Evita che GitHub Pages processi i file |

## Flusso utente

1. Un nuovo dipendente visita il portale → tab **Registrati** → crea account.
2. Il trigger su Supabase crea il record `profiles` con `status='pending'`.
3. L'utente vede la schermata "Account in attesa di approvazione".
4. Un admin entra nel tab **Utenti**, preme **Approva** (eventualmente modifica ruolo/quota).
5. L'utente ricarica e può entrare nel portale.

## Sicurezza

Le policy RLS garantiscono che:

- Un dipendente veda solo il proprio profilo e le proprie richieste.
- Solo gli admin possano leggere tutti i profili e tutte le richieste.
- Solo gli admin possano approvare, rifiutare o eliminare richieste.
- Un utente non-attivo (pending/disabled) non può inserire nuove richieste.

Non c'è mai la `service_role` nel frontend: si usa solo la `anon key`.
