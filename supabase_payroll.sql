-- =====================================================================
-- Marathonbet Leave Control - Schede dipendente & simulazione payslip
-- =====================================================================
-- Esegui questo script nel SQL Editor di Supabase DOPO supabase_setup.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Dati retributivi per dipendente (visibili SOLO agli admin)
-- ---------------------------------------------------------------------
create table if not exists public.employee_pay (
  employee_id     uuid primary key references public.profiles(id) on delete cascade,
  job_title       text not null default '',
  department      text not null default '',
  contract_start  date,
  annual_salary   numeric(12,2) not null default 0 check (annual_salary >= 0),
  daily_rate      numeric(10,2) not null default 0 check (daily_rate >= 0),
  notes           text not null default '',
  updated_at      timestamptz not null default now()
);

-- Se la tabella esisteva gia' con meno colonne
alter table public.employee_pay add column if not exists job_title      text not null default '';
alter table public.employee_pay add column if not exists department     text not null default '';
alter table public.employee_pay add column if not exists contract_start date;
alter table public.employee_pay add column if not exists annual_salary  numeric(12,2) not null default 0;
alter table public.employee_pay add column if not exists daily_rate     numeric(10,2) not null default 0;
alter table public.employee_pay add column if not exists notes          text not null default '';

-- ---------------------------------------------------------------------
-- 2) Voci aggiuntive della payslip mensile (bonus)
--    kind = 'Ferie pagate' -> amount = days * daily_rate (calcolato dal portale)
--    kind = 'Rimborso'     -> amount inserito a mano
-- ---------------------------------------------------------------------
create table if not exists public.payslip_items (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.profiles(id) on delete cascade,
  month        date not null check (extract(day from month) = 1),
  kind         text not null check (kind in ('Ferie pagate','Rimborso')),
  description  text not null default '',
  days         numeric(5,2) check (days is null or days >= 0),
  amount       numeric(10,2) not null check (amount >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists payslip_items_emp_month_idx
  on public.payslip_items(employee_id, month);

-- ---------------------------------------------------------------------
-- 3) RLS: solo admin attivi leggono/scrivono
-- ---------------------------------------------------------------------
alter table public.employee_pay  enable row level security;
alter table public.payslip_items enable row level security;

drop policy if exists "employee_pay_admin_all"  on public.employee_pay;
drop policy if exists "payslip_items_admin_all" on public.payslip_items;

create policy "employee_pay_admin_all"
  on public.employee_pay for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "payslip_items_admin_all"
  on public.payslip_items for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------------------------------------------------------------------
-- 4) FIX SICUREZZA: un utente non-admin non puo' modificare da solo
--    ruolo, stato o quota del proprio profilo (prima la policy
--    "profiles_update_self_basic" glielo permetteva via API).
--    Service role / SQL Editor (nessun utente loggato) restano liberi.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role         is distinct from old.role
    or new.status       is distinct from old.status
    or new.annual_quota is distinct from old.annual_quota
    or new.id           is distinct from old.id then
      raise exception 'Solo un admin puo'' modificare ruolo, stato o quota';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;

create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();
