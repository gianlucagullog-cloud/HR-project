-- =====================================================================
-- Marathonbet Leave Control - Dati di fatturazione, bancari & invio fatture
-- =====================================================================
-- Esegui nel SQL Editor di Supabase DOPO supabase_validations.sql.
-- E' idempotente (puoi rieseguirlo senza rompere nulla).
-- =====================================================================

-- 1) Dati di fatturazione del dipendente
alter table public.employee_pay add column if not exists billing_email   text not null default '';
alter table public.employee_pay add column if not exists billing_name    text not null default '';
alter table public.employee_pay add column if not exists billing_address text not null default '';
alter table public.employee_pay add column if not exists tax_id          text not null default '';

-- 1b) Dati bancari (per il pagamento delle fatture)
alter table public.employee_pay add column if not exists bank_holder text not null default '';
alter table public.employee_pay add column if not exists bank_name   text not null default '';
alter table public.employee_pay add column if not exists iban        text not null default '';
alter table public.employee_pay add column if not exists bic_swift   text not null default '';

-- 1c) Tipo di compenso: 'daily' = daily rate x giorni lavorati (salario = rate x 228)
--                       'fixed' = salario fisso annuo, fatturato 1/12 al mese
alter table public.employee_pay add column if not exists pay_type text not null default 'daily';
alter table public.employee_pay drop constraint if exists employee_pay_pay_type_check;
alter table public.employee_pay add constraint employee_pay_pay_type_check check (pay_type in ('daily','fixed'));

-- 2) Il daily rate diventa il dato principale: salario annuo = daily rate x 228.
--    Riallinea le schede esistenti (salvate quando il dato principale era il salario).
update public.employee_pay
   set daily_rate = round(annual_salary / 228, 2)
 where annual_salary > 0
   and daily_rate <> round(annual_salary / 228, 2);

-- 3) Traccia dell'invio della fattura (solo mesi validati)
alter table public.payslip_validations add column if not exists sent_at timestamptz;
alter table public.payslip_validations add column if not exists sent_to text;
