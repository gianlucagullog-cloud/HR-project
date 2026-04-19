-- =====================================================================
-- Marathonbet Leave Control - Setup Supabase
-- =====================================================================
-- Esegui TUTTO questo script nel SQL Editor del tuo progetto Supabase.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tabelle
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text not null,
  role          text not null default 'employee' check (role in ('employee','admin')),
  status        text not null default 'pending'  check (status in ('pending','active','disabled')),
  annual_quota  integer not null default 33,
  created_at    timestamptz not null default now()
);

-- Se la tabella esisteva gia', aggiungi le colonne nuove
alter table public.profiles
  add column if not exists status text not null default 'pending'
  check (status in ('pending','active','disabled'));

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.profiles(id) on delete cascade,
  type           text not null check (type in ('Ferie','Permesso','Malattia')),
  start_date     date not null,
  end_date       date not null,
  working_days   integer not null check (working_days >= 0),
  status         text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  notes          text default '',
  created_at     timestamptz not null default now()
);

create index if not exists leave_requests_employee_idx on public.leave_requests(employee_id);
create index if not exists leave_requests_status_idx   on public.leave_requests(status);

-- ---------------------------------------------------------------------
-- 2) Helper: is_admin() - evita ricorsione RLS
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' and status = 'active'
       from public.profiles
      where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ---------------------------------------------------------------------
-- 3) Trigger: crea automaticamente il profilo al signup
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status, annual_quota)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    'employee',
    'pending',
    33
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4) RLS policies
-- ---------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.leave_requests  enable row level security;

-- Pulisci policies esistenti con gli stessi nomi
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_select_team_for_admin" on public.profiles;
drop policy if exists "profiles_update_self_basic"    on public.profiles;
drop policy if exists "profiles_update_admin"         on public.profiles;
drop policy if exists "profiles_insert_self"          on public.profiles;

-- Un utente vede SEMPRE il proprio profilo; admin vede tutti
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  to authenticated
  using ( id = auth.uid() or public.is_admin() );

-- L'utente puo' aggiornare nome/email; admin puo' aggiornare tutto
create policy "profiles_update_self_basic"
  on public.profiles for update
  to authenticated
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- Insert e' gestito dal trigger (security definer), ma lasciamo una policy
-- sicura nel caso qualcuno inserisca manualmente.
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check ( id = auth.uid() );

-- Leave requests
drop policy if exists "leave_select_own_or_admin" on public.leave_requests;
drop policy if exists "leave_insert_own_or_admin" on public.leave_requests;
drop policy if exists "leave_update_admin"        on public.leave_requests;
drop policy if exists "leave_delete_admin"        on public.leave_requests;

create policy "leave_select_own_or_admin"
  on public.leave_requests for select
  to authenticated
  using ( employee_id = auth.uid() or public.is_admin() );

create policy "leave_insert_own_or_admin"
  on public.leave_requests for insert
  to authenticated
  with check (
    (employee_id = auth.uid() and
      exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.status = 'active'))
    or public.is_admin()
  );

create policy "leave_update_admin"
  on public.leave_requests for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "leave_delete_admin"
  on public.leave_requests for delete
  to authenticated
  using ( public.is_admin() );

-- ---------------------------------------------------------------------
-- 5) Promuovi il primo utente ad admin attivo
-- ---------------------------------------------------------------------
--   a) Registra il tuo account dall'interfaccia web (diventa 'pending').
--   b) Torna qui e lancia lo statement sotto con la tua email:
--
--   update public.profiles
--      set role = 'admin', status = 'active'
--    where email = 'TUA_EMAIL@azienda.com';
--
-- Da quel momento potrai approvare gli altri utenti dal portale.
-- =====================================================================
