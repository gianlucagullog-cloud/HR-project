-- =====================================================================
-- Correzioni di sicurezza (da eseguire una volta nel SQL Editor di Supabase)
-- Rieseguibile: ogni policy viene prima eliminata e poi ricreata.
-- =====================================================================

-- 1) Un dipendente può inserire solo richieste "Pending" a proprio nome.
--    Prima poteva inserire direttamente una richiesta già "Approved"
--    chiamando l'API, saltando l'approvazione.
drop policy if exists "leave_insert_own_or_admin" on public.leave_requests;
create policy "leave_insert_own_or_admin"
  on public.leave_requests for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      employee_id = auth.uid()
      and status = 'Pending'
      and exists (select 1 from public.profiles p
                   where p.id = auth.uid() and p.status = 'active')
    )
  );

-- 2) Un dipendente può annullare la validazione della propria fattura solo
--    finché non è stata inviata. Prima poteva annullare anche una fattura
--    già validata e inviata dall'HR, e poi cambiarne giorni e importo.
drop policy if exists "payslip_validations_delete_own" on public.payslip_validations;
create policy "payslip_validations_delete_own"
  on public.payslip_validations for delete
  to authenticated
  using ( employee_id = auth.uid() and sent_at is null );

-- 3) Un dipendente non può cambiare la propria email nel profilo
--    (oltre a ruolo, stato e quota, già protetti).
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
    or new.email        is distinct from old.email
    or new.id           is distinct from old.id then
      raise exception 'Solo un admin puo'' modificare ruolo, stato, quota o email';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- 4) is_admin() non serve agli utenti non autenticati.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
