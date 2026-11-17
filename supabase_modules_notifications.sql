-- =====================================================================
-- Marathonbet Leave Control - Funzioni per utente + notifiche email
-- =====================================================================
-- 1) Per ogni utente: fatturazione, rimborsi spese e notifiche email
--    attivabili/disattivabili dall'admin (scheda dipendente).
-- 2) Email automatiche al dipendente: richiesta ricevuta, approvata,
--    negata, modificata, revocata, eliminata + promemoria fattura mensile.
--    L'invio lo fa la Edge Function "send-notifications" (vedi README).
--
-- Prima di eseguire: crea il segreto condiviso con la Edge Function
-- (stesso valore del secret NOTIFY_SECRET della funzione):
--
--   select vault.create_secret('METTI-QUI-UNA-STRINGA-LUNGA-CASUALE', 'notify_secret');
--
-- Rieseguibile.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Funzioni attive per utente
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists invoicing_enabled   boolean not null default true;
alter table public.profiles add column if not exists expenses_enabled    boolean not null default true;
alter table public.profiles add column if not exists email_notifications boolean not null default true;

-- Solo l'admin può cambiare ruolo, stato, quota, email e funzioni attive
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role                is distinct from old.role
    or new.status              is distinct from old.status
    or new.annual_quota        is distinct from old.annual_quota
    or new.email               is distinct from old.email
    or new.id                  is distinct from old.id
    or new.invoicing_enabled   is distinct from old.invoicing_enabled
    or new.expenses_enabled    is distinct from old.expenses_enabled
    or new.email_notifications is distinct from old.email_notifications then
      raise exception 'Solo un admin puo'' modificare ruolo, stato, quota, email o funzioni attive';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Rimborsi spese: il dipendente può inserirli solo se la funzione è attiva per lui
drop policy if exists "expense_claims_insert_own" on public.expense_claims;
create policy "expense_claims_insert_own"
  on public.expense_claims for insert
  to authenticated
  with check (
    employee_id = auth.uid()
    and exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.status = 'active' and p.expenses_enabled)
  );

-- ---------------------------------------------------------------------
-- 2) Registro delle email inviate (solo admin in lettura)
-- ---------------------------------------------------------------------
create table if not exists public.notification_log (
  id          bigserial primary key,
  employee_id uuid references public.profiles(id) on delete set null,
  recipient   text not null,
  kind        text not null,          -- request_received, approved, rejected, modified, revoked, deleted, invoice_reminder, invoice_overdue, admin_new_request
  ref_key     text,                   -- id richiesta o "YYYY-MM" per i promemoria (evita doppioni)
  subject     text,
  status      text not null default 'sent',  -- sent | error | skipped
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists notification_log_ref_idx on public.notification_log(kind, ref_key, employee_id);

alter table public.notification_log enable row level security;
drop policy if exists "notification_log_admin_select" on public.notification_log;
create policy "notification_log_admin_select"
  on public.notification_log for select
  to authenticated
  using ( public.is_admin() );

-- ---------------------------------------------------------------------
-- 3) Chiamata alla Edge Function (pg_net)
-- ---------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.call_notify(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_secret' limit 1;
  if secret is null then
    raise warning 'notify_secret mancante nel Vault: email non inviata';
    return;
  end if;
  perform net.http_post(
    url     := 'https://dnyoefjtbkjqtyvitiif.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', secret),
    body    := payload
  );
exception when others then
  -- una notifica non deve mai bloccare il salvataggio della richiesta
  raise warning 'Notifica non inviata: %', sqlerrm;
end;
$$;

revoke execute on function public.call_notify(jsonb) from public, anon, authenticated;

-- Trigger sulle richieste di assenza
create or replace function public.notify_leave_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.status       is not distinct from old.status
     and new.start_date   is not distinct from old.start_date
     and new.end_date     is not distinct from old.end_date
     and new.working_days is not distinct from old.working_days
     and new.type         is not distinct from old.type then
    return new;  -- cambiate solo le note: nessuna email
  end if;

  perform public.call_notify(jsonb_build_object(
    'event',      'leave',
    'op',         tg_op,
    'record',     case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    'old_record', case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    'actor',      auth.uid()
  ));
  return coalesce(new, old);
end;
$$;

drop trigger if exists notify_leave_change on public.leave_requests;
create trigger notify_leave_change
  after insert or update or delete on public.leave_requests
  for each row execute function public.notify_leave_change();

-- ---------------------------------------------------------------------
-- 4) Promemoria fattura (pg_cron), ora UTC
--    - giorno 25 alle 08:00: "prepara la fattura del mese"
--    - giorno 3 alle 08:00: sollecito se la fattura del mese precedente
--      non è ancora validata
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule(jobid) from cron.job
   where jobname in ('invoice-reminder-upcoming', 'invoice-reminder-overdue');
end $$;

select cron.schedule('invoice-reminder-upcoming', '0 8 25 * *',
  $$ select public.call_notify('{"event":"invoice_reminder","mode":"upcoming"}'::jsonb) $$);

select cron.schedule('invoice-reminder-overdue', '0 8 3 * *',
  $$ select public.call_notify('{"event":"invoice_reminder","mode":"overdue"}'::jsonb) $$);
