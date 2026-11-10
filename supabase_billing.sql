-- =====================================================================
-- Marathonbet Leave Control - Dati di fatturazione & invio fatture
-- =====================================================================
-- Esegui nel SQL Editor di Supabase DOPO supabase_validations.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
-- =====================================================================

-- 1) Dati di fatturazione del dipendente
alter table public.employee_pay add column if not exists billing_email   text not null default '';
alter table public.employee_pay add column if not exists billing_name    text not null default '';
alter table public.employee_pay add column if not exists billing_address text not null default '';
alter table public.employee_pay add column if not exists tax_id          text not null default '';

-- 2) Il daily rate diventa il dato principale: salario annuo = daily rate x 228.
--    Riallinea le schede esistenti (salvate quando il dato principale era il salario).
update public.employee_pay
   set daily_rate = round(annual_salary / 228, 2)
 where annual_salary > 0
   and daily_rate <> round(annual_salary / 228, 2);

-- 3) Traccia dell'invio della fattura (solo mesi validati)
alter table public.payslip_validations add column if not exists sent_at timestamptz;
alter table public.payslip_validations add column if not exists sent_to text;
