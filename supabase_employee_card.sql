-- =====================================================================
-- Marathonbet Leave Control - "La mia scheda" per i dipendenti
-- =====================================================================
-- Esegui nel SQL Editor di Supabase DOPO supabase_billing.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
--
-- Ogni dipendente puo' SOLO LEGGERE i propri dati:
--   - scheda contrattuale e di fatturazione (senza le note interne dell'admin)
--   - fatture validate
--   - azzeramenti del saldo ferie
-- Nessuna modifica e' consentita ai dipendenti.
-- =====================================================================

-- 1) Scheda del dipendente loggato (esclude il campo "notes" riservato all'admin)
create or replace function public.my_employee_card()
returns table (
  job_title       text,
  department      text,
  contract_start  date,
  pay_type        text,
  daily_rate      numeric,
  annual_salary   numeric,
  billing_name    text,
  billing_email   text,
  billing_address text,
  tax_id          text,
  bank_holder     text,
  bank_name       text,
  iban            text,
  bic_swift       text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.job_title, p.department, p.contract_start, p.pay_type, p.daily_rate, p.annual_salary,
         p.billing_name, p.billing_email, p.billing_address, p.tax_id,
         p.bank_holder, p.bank_name, p.iban, p.bic_swift
    from public.employee_pay p
    join public.profiles pr on pr.id = p.employee_id
   where p.employee_id = auth.uid()
     and pr.status = 'active';
$$;

revoke all on function public.my_employee_card() from public, anon;
grant execute on function public.my_employee_card() to authenticated;

-- 2) Fatture validate: ognuno legge solo le proprie
drop policy if exists "payslip_validations_select_own" on public.payslip_validations;
create policy "payslip_validations_select_own"
  on public.payslip_validations for select
  to authenticated
  using ( employee_id = auth.uid() );

-- 2b) Voci extra della fattura (rimborsi, ferie liquidate): ognuno legge solo le proprie
drop policy if exists "payslip_items_select_own" on public.payslip_items;
create policy "payslip_items_select_own"
  on public.payslip_items for select
  to authenticated
  using ( employee_id = auth.uid() );

-- 3) Azzeramenti ferie: ognuno legge solo i propri (servono al saldo ferie)
drop policy if exists "leave_adjustments_select_own" on public.leave_adjustments;
create policy "leave_adjustments_select_own"
  on public.leave_adjustments for select
  to authenticated
  using ( employee_id = auth.uid() );
