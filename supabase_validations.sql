-- =====================================================================
-- Marathonbet Leave Control - Azzeramento ferie & validazione fatture
-- =====================================================================
-- Esegui nel SQL Editor di Supabase DOPO supabase_payroll.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Azzeramento contatore ferie godute (per dipendente e anno).
--    used_offset = giorni di ferie godute "azzerati": il saldo mostra
--    godute = approvate nell'anno - used_offset. Le richieste restano.
-- ---------------------------------------------------------------------
create table if not exists public.leave_adjustments (
  employee_id  uuid not null references public.profiles(id) on delete cascade,
  year         integer not null check (year between 2000 and 2100),
  used_offset  numeric(6,2) not null default 0 check (used_offset >= 0),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null,
  primary key (employee_id, year)
);

-- ---------------------------------------------------------------------
-- 2) Mesi validati (importo "congelato" al momento della validazione)
-- ---------------------------------------------------------------------
create table if not exists public.payslip_validations (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.profiles(id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  amount        numeric(12,2) not null check (amount >= 0),
  daily_rate    numeric(10,2) not null default 0,
  worked_days   numeric(5,2) not null default 0,
  paid_leave    numeric(5,2) not null default 0,
  bonus_amount  numeric(12,2) not null default 0,
  details       jsonb not null default '{}'::jsonb,
  validated_at  timestamptz not null default now(),
  validated_by  uuid references public.profiles(id) on delete set null,
  unique (employee_id, month)
);

create index if not exists payslip_validations_emp_idx
  on public.payslip_validations(employee_id, month);

-- ---------------------------------------------------------------------
-- 3) RLS: solo admin attivi
-- ---------------------------------------------------------------------
alter table public.leave_adjustments   enable row level security;
alter table public.payslip_validations enable row level security;

drop policy if exists "leave_adjustments_admin_all"   on public.leave_adjustments;
drop policy if exists "payslip_validations_admin_all" on public.payslip_validations;

create policy "leave_adjustments_admin_all"
  on public.leave_adjustments for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "payslip_validations_admin_all"
  on public.payslip_validations for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );
