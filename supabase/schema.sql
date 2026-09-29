-- Run in Supabase SQL Editor
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, role text not null default 'technician' check (role in ('admin','technician')));
create table machines (
  id uuid primary key default gen_random_uuid(),
  machine_id text not null unique check (machine_id ~ '^[A-Za-z0-9_-]{2,20}$'),
  name text not null, type text not null, location text not null,
  status text not null default 'Stop' check (status in ('Running','Stop','Alarm','Maintenance')),
  created_at timestamptz default now());
create table alarms (
  id uuid primary key default gen_random_uuid(),
  machine_ref uuid not null references machines(id) on delete cascade,
  alarm_code text not null, description text not null,
  occurred_at timestamptz not null default now(), cause text,
  status text not null default 'Open' check (status in ('Open','In Progress','Closed')),
  created_at timestamptz default now());
create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  machine_ref uuid not null references machines(id) on delete cascade,
  maintenance_type text not null, problem text not null, action_taken text,
  technician text not null, maint_date date not null default current_date,
  status text not null default 'Planned' check (status in ('Planned','In Progress','Done')),
  created_at timestamptz default now());

create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id, full_name) values (new.id, new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
create function is_admin() returns boolean language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

alter table profiles enable row level security;
alter table machines enable row level security;
alter table alarms enable row level security;
alter table maintenance_records enable row level security;

create policy p_sel on profiles for select using (id = auth.uid() or is_admin());
create policy p_upd on profiles for update using (is_admin());
create policy m_sel on machines for select to authenticated using (true);
create policy m_all on machines for all using (is_admin()) with check (is_admin());
create policy a_sel on alarms for select to authenticated using (true);
create policy a_upd on alarms for update to authenticated using (true);
create policy a_ins on alarms for insert with check (is_admin());
create policy a_del on alarms for delete using (is_admin());
create policy x_sel on maintenance_records for select to authenticated using (true);
create policy x_ins on maintenance_records for insert to authenticated with check (true);
create policy x_upd on maintenance_records for update to authenticated using (true);
create policy x_del on maintenance_records for delete using (is_admin());

-- Promote a user to admin:
-- update profiles set role='admin' where full_name='you@example.com';

-- Technician may change alarm status only (column-level guard)
create function alarm_guard() returns trigger language plpgsql as $$
begin
  if not is_admin() and (new.machine_ref, new.alarm_code, new.description, new.occurred_at, new.cause)
     is distinct from (old.machine_ref, old.alarm_code, old.description, old.occurred_at, old.cause) then
    raise exception 'Technician can change alarm status only';
  end if;
  return new;
end $$;
create trigger alarm_guard_t before update on alarms for each row execute function alarm_guard();
update profiles set role='admin' where full_name='tanatip-a@rmutp.ac.th';


-- Fix: fixed search_path so the signup trigger works with Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;