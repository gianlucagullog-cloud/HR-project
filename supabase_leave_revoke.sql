-- =====================================================================
-- Marathonbet Leave Control - Revoca ferie approvate
-- =====================================================================
-- Aggiunge lo stato 'Revoked' (revocata) alle richieste di assenza.
-- E' idempotente.
alter table public.leave_requests drop constraint if exists leave_requests_status_check;
alter table public.leave_requests add constraint leave_requests_status_check
  check (status in ('Pending','Approved','Rejected','Revoked'));
