-- =====================================================================
-- Marathonbet Leave Control - Dati fattura compilabili dal dipendente
-- =====================================================================
-- Esegui nel SQL Editor di Supabase DOPO supabase_employee_card.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
--
-- 1) invoice_drafts: numero fattura, descrizione, giorni e importo di ogni
--    mese, salvati nel database (visibili sia all'HR sia al dipendente).
--    Il dipendente modifica solo i propri mesi NON ancora validati.
-- 2) Il dipendente puo' annullare la validazione dei propri mesi.
-- =====================================================================

create table if not exists public.invoice_drafts (
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  month           date not null check (extract(day from month) = 1),
  invoice_number  text not null default '',
  description     text not null default '',
  days            numeric(5,2)  check (days  is null or days  >= 0),
  total           numeric(12,2) check (total is null or total >= 0),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.profiles(id) on delete set null,
  primary key (employee_id, month)
);

alter table public.invoice_drafts enable row level security;

-- Mese gia' validato? (usata dalle policy, evita ricorsione RLS)
create or replace function public.month_is_validated(emp uuid, m date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.payslip_validations v
     where v.employee_id = emp and v.month = m
  );
$$;
grant execute on function public.month_is_validated(uuid, date) to authenticated;

drop policy if exists "invoice_drafts_admin_all"  on public.invoice_drafts;
drop policy if exists "invoice_drafts_select_own" on public.invoice_drafts;
drop policy if exists "invoice_drafts_insert_own" on public.invoice_drafts;
drop policy if exists "invoice_drafts_update_own" on public.invoice_drafts;
drop policy if exists "invoice_drafts_delete_own" on public.invoice_drafts;

create policy "invoice_drafts_admin_all"
  on public.invoice_drafts for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "invoice_drafts_select_own"
  on public.invoice_drafts for select
  to authenticated
  using ( employee_id = auth.uid() );

create policy "invoice_drafts_insert_own"
  on public.invoice_drafts for insert
  to authenticated
  with check ( employee_id = auth.uid() and not public.month_is_validated(employee_id, month) );

create policy "invoice_drafts_update_own"
  on public.invoice_drafts for update
  to authenticated
  using ( employee_id = auth.uid() and not public.month_is_validated(employee_id, month) )
  with check ( employee_id = auth.uid() and not public.month_is_validated(employee_id, month) );

create policy "invoice_drafts_delete_own"
  on public.invoice_drafts for delete
  to authenticated
  using ( employee_id = auth.uid() and not public.month_is_validated(employee_id, month) );

-- 2) Il dipendente puo' annullare la validazione dei propri mesi
drop policy if exists "payslip_validations_delete_own" on public.payslip_validations;
create policy "payslip_validations_delete_own"
  on public.payslip_validations for delete
  to authenticated
  using ( employee_id = auth.uid() );
