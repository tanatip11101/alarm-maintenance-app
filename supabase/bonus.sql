-- Bonus features: run once in Supabase SQL Editor
-- 1) Viewer role + Waiting Part status
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin','technician','viewer'));
alter table maintenance_records drop constraint if exists maintenance_records_status_check;
alter table maintenance_records add constraint maintenance_records_status_check
  check (status in ('Planned','In Progress','Waiting Part','Done'));

-- 2) Only admin/technician may write (viewer is read-only)
create or replace function public.is_tech() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','technician')) $$;
drop policy if exists a_upd on alarms;
drop policy if exists x_ins on maintenance_records;
drop policy if exists x_upd on maintenance_records;
create policy a_upd on alarms for update using (is_tech());
create policy x_ins on maintenance_records for insert with check (is_tech());
create policy x_upd on maintenance_records for update using (is_tech());

-- 3) Audit log (admin can read)
create table audit_log (
  id bigint generated always as identity primary key,
  table_name text, action text, row_id uuid,
  changed_by uuid, changed_by_email text, detail jsonb,
  created_at timestamptz default now());
alter table audit_log enable row level security;
create policy au_sel on audit_log for select using (is_admin());
create or replace function public.audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  insert into audit_log(table_name, action, row_id, changed_by, changed_by_email, detail)
  values (tg_table_name, tg_op, (r->>'id')::uuid, auth.uid(),
          (select email from auth.users where id = auth.uid()), r);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger audit_m after insert or update or delete on machines for each row execute function audit();
create trigger audit_a after insert or update or delete on alarms for each row execute function audit();
create trigger audit_x after insert or update or delete on maintenance_records for each row execute function audit();

-- Make someone a viewer:
-- update profiles set role='viewer' where full_name='email';
