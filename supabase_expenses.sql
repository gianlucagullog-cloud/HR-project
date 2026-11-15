-- =====================================================================
-- Rimborsi spese: il dipendente inserisce cosa ha comprato e quanto.
-- Totale da rimborsare = somma spese − voci "Rimborso" in fattura (payslip_items).
-- Rieseguibile.
-- =====================================================================

create table if not exists public.expense_claims (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.profiles(id) on delete cascade,
  purchase_date  date not null default current_date,
  description    text not null check (length(trim(description)) > 0),
  amount         numeric(10,2) not null check (amount > 0),
  created_at     timestamptz not null default now(),
  created_by     uuid references public.profiles(id) on delete set null default auth.uid()
);

create index if not exists expense_claims_emp_idx on public.expense_claims(employee_id, purchase_date);

alter table public.expense_claims enable row level security;

drop policy if exists "expense_claims_admin_all"  on public.expense_claims;
drop policy if exists "expense_claims_select_own" on public.expense_claims;
drop policy if exists "expense_claims_insert_own" on public.expense_claims;
drop policy if exists "expense_claims_delete_own" on public.expense_claims;

create policy "expense_claims_admin_all"
  on public.expense_claims for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

create policy "expense_claims_select_own"
  on public.expense_claims for select
  to authenticated
  using ( employee_id = auth.uid() );

create policy "expense_claims_insert_own"
  on public.expense_claims for insert
  to authenticated
  with check (
    employee_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active')
  );

create policy "expense_claims_delete_own"
  on public.expense_claims for delete
  to authenticated
  using ( employee_id = auth.uid() );
