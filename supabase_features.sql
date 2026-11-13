-- =====================================================================
-- Mezze giornate e storico compensi (eseguire una volta nel SQL Editor)
-- Rieseguibile.
-- =====================================================================

-- Mezze giornate: i giorni possono essere 0,5
alter table public.leave_requests alter column working_days type numeric(5,1);
alter table public.leave_requests add column if not exists half_day boolean not null default false;

-- Storico compensi: ogni riga vale dal mese indicato in poi
create table if not exists public.employee_rate_history (
  employee_id    uuid not null references public.profiles(id) on delete cascade,
  valid_from     date not null,
  pay_type       text not null default 'daily' check (pay_type in ('daily','fixed')),
  daily_rate     numeric(10,2) not null default 0 check (daily_rate >= 0),
  annual_salary  numeric(12,2) not null default 0 check (annual_salary >= 0),
  created_at     timestamptz not null default now(),
  primary key (employee_id, valid_from)
);

alter table public.employee_rate_history enable row level security;

drop policy if exists "rate_history_admin_all"  on public.employee_rate_history;
drop policy if exists "rate_history_select_own" on public.employee_rate_history;

create policy "rate_history_admin_all"
  on public.employee_rate_history for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- Il dipendente vede il proprio storico (serve a calcolare la propria fattura)
create policy "rate_history_select_own"
  on public.employee_rate_history for select
  to authenticated
  using ( employee_id = auth.uid() );
