-- =====================================================================
-- Marathonbet Leave Control - Giorni lavorabili / lavorati modificati a mano
-- =====================================================================
-- Esegui nel SQL Editor di Supabase. E' idempotente.
--
-- month_days: per dipendente e mese, valori inseriti a mano dall'HR che
-- sostituiscono i giorni lavorabili (calendario) e i giorni lavorati
-- (fattura validata). Null = usa il valore calcolato.
-- Per il 2026 le ferie godute = somma (lavorabili - lavorati) dei mesi
-- validati o con giorni lavorati inseriti a mano.
-- =====================================================================

create table if not exists public.month_days (
  employee_id    uuid not null references public.profiles(id) on delete cascade,
  month          date not null check (extract(day from month) = 1),
  workable_days  numeric(5,2) check (workable_days is null or workable_days >= 0),
  worked_days    numeric(5,2) check (worked_days   is null or worked_days   >= 0),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references public.profiles(id) on delete set null,
  primary key (employee_id, month)
);

alter table public.month_days enable row level security;

drop policy if exists "month_days_admin_all"  on public.month_days;
drop policy if exists "month_days_select_own" on public.month_days;

create policy "month_days_admin_all"
  on public.month_days for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "month_days_select_own"
  on public.month_days for select
  to authenticated
  using ( employee_id = auth.uid() );
