-- Hospital Management System schema for a new Supabase project.
-- Run once from Supabase Dashboard -> SQL Editor.
-- New Auth users start as patients. After running this SQL, use
-- `npm run supabase:seed-demo` to create the requested demo accounts and
-- their doctor/patient records (the service-role key is read server-side).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

do $$
begin
  create type public.app_role as enum ('admin', 'doctor', 'patient');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.appointment_status as enum (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.invoice_status as enum ('paid', 'partially_paid', 'unpaid');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_method as enum ('cash', 'card');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum ('pending', 'success', 'failed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.medicine_timing as enum (
    'before_meal',
    'after_meal',
    'anytime'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  role public.app_role not null default 'patient',
  avatar_url text,
  country text,
  state text,
  city text,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  specialization text not null,
  qualification text not null,
  bio text,
  consultation_fee numeric not null check (consultation_fee > 0),
  status text not null default 'available',
  constraint doctors_profile_id_fkey
    foreign key (profile_id) references public.profiles (id) on delete cascade,
  constraint doctors_profile_id_key unique (profile_id)
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  date_of_birth date,
  blood_group text,
  primary_doctor_id uuid,
  stay_address text,
  permanent_address text,
  constraint patients_profile_id_fkey
    foreign key (profile_id) references public.profiles (id) on delete cascade,
  constraint patients_profile_id_key unique (profile_id),
  constraint patients_primary_doctor_id_fkey
    foreign key (primary_doctor_id) references public.doctors (id) on delete restrict
);

create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null,
  slot_duration_minutes integer not null check (slot_duration_minutes > 0),
  is_active boolean not null default true,
  check (start_time < end_time)
);

create table if not exists public.statuses (
  id public.appointment_status primary key,
  name text not null unique,
  status text
);

insert into public.statuses (id, name, status)
values
  ('pending', 'Pending', 'pending'),
  ('confirmed', 'Confirmed', 'confirmed'),
  ('completed', 'Completed', 'completed'),
  ('cancelled', 'Cancelled', 'cancelled')
on conflict (id) do update
  set name = excluded.name, status = excluded.status;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  doctor_id uuid not null,
  appointment_date date not null,
  time_slot text not null,
  reason_of_visit text,
  status public.appointment_status not null default 'pending'
    references public.statuses (id),
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_patient_id_fkey
    foreign key (patient_id) references public.patients (id) on delete cascade,
  constraint appointments_doctor_id_fkey
    foreign key (doctor_id) references public.doctors (id) on delete restrict
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete restrict,
  diagnosis text not null,
  blood_pressure text,
  temperature numeric,
  pulse_rate numeric,
  weight numeric,
  height numeric,
  spo2 numeric,
  advice text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null
    references public.prescriptions (id) on delete cascade,
  medicine_name text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  timing public.medicine_timing not null,
  instructions text
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text,
  appointment_id uuid references public.appointments (id) on delete set null,
  patient_id uuid not null references public.patients (id) on delete cascade,
  issued_date date not null,
  due_date date,
  subtotal numeric not null check (subtotal >= 0),
  tax_percentage numeric not null check (tax_percentage between 0 and 100),
  discount numeric not null check (discount between 0 and 100),
  total numeric not null check (total >= 0),
  status public.invoice_status not null default 'unpaid',
  notes text
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  item_name text not null,
  description text,
  unit_cost numeric not null check (unit_cost >= 0),
  quantity integer not null check (quantity >= 1),
  amount numeric not null check (amount >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_paid numeric not null check (amount_paid > 0),
  payment_date date not null,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  reference_number text
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_table text,
  target_id text,
  created_at timestamptz not null default now(),
  constraint activity_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null
);

alter table public.activity_logs
  drop constraint if exists activity_logs_actor_id_fkey;
alter table public.activity_logs
  add constraint activity_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles (id) on delete set null;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_full_name_idx on public.profiles (full_name);
create index if not exists doctors_specialization_idx on public.doctors (specialization);
create index if not exists patients_primary_doctor_id_idx on public.patients (primary_doctor_id);
create index if not exists doctor_schedules_doctor_day_idx
  on public.doctor_schedules (doctor_id, day_of_week);
create index if not exists appointments_patient_date_idx
  on public.appointments (patient_id, appointment_date desc);
create index if not exists appointments_doctor_date_idx
  on public.appointments (doctor_id, appointment_date desc);
create index if not exists appointments_created_at_idx
  on public.appointments (created_at desc);
create index if not exists prescriptions_patient_created_at_idx
  on public.prescriptions (patient_id, created_at desc);
create index if not exists prescriptions_doctor_created_at_idx
  on public.prescriptions (doctor_id, created_at desc);
create index if not exists prescriptions_appointment_id_idx
  on public.prescriptions (appointment_id);
create index if not exists prescription_items_prescription_id_idx
  on public.prescription_items (prescription_id);
create index if not exists invoices_patient_issued_idx
  on public.invoices (patient_id, issued_date desc);
create index if not exists invoices_appointment_id_idx
  on public.invoices (appointment_id);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_id_idx on public.activity_logs (actor_id);

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_app_role()) = 'admin', false)
$$;

create or replace function private.current_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.doctors as d
  where d.profile_id = (select auth.uid())
$$;

create or replace function private.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.patients as p
  where p.profile_id = (select auth.uid())
$$;

create or replace function private.can_access_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1
      from public.patients as p
      where p.id = target_patient_id
        and (
          p.profile_id = (select auth.uid())
          or p.primary_doctor_id = (select private.current_doctor_id())
          or exists (
            select 1
            from public.appointments as a
            where a.patient_id = p.id
              and a.doctor_id = (select private.current_doctor_id())
          )
        )
    )
$$;

create or replace function private.can_access_patient_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or target_profile_id = (select auth.uid())
    or exists (
      select 1
      from public.doctors as d
      where d.profile_id = target_profile_id
    )
    or exists (
      select 1
      from public.patients as p
      where p.profile_id = target_profile_id
        and private.can_access_patient(p.id)
    )
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'patient'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end
$$;

create or replace function private.log_activity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  changed_row jsonb;
  entity_name text;
  event_action text;
  target_id text;
begin
  if tg_op = 'INSERT' then
    new_row := to_jsonb(new);
    changed_row := new_row;
    event_action := 'Created';
  elsif tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    new_row := to_jsonb(new);

    if old_row is not distinct from new_row then
      return new;
    end if;

    changed_row := new_row;
    event_action := 'Updated';
  else
    old_row := to_jsonb(old);
    changed_row := old_row;
    event_action := 'Deleted';
  end if;

  entity_name := case tg_table_name
    when 'doctor_schedules' then 'doctor schedule'
    when 'prescription_items' then 'prescription item'
    when 'invoice_items' then 'invoice item'
    else regexp_replace(tg_table_name, '_', ' ', 'g')
  end;

  if tg_op = 'UPDATE'
    and old_row ? 'status'
    and old_row -> 'status' is distinct from new_row -> 'status' then
    event_action := format(
      'Changed %s status from %s to %s',
      entity_name,
      coalesce(initcap(old_row ->> 'status'), 'Unknown'),
      coalesce(initcap(new_row ->> 'status'), 'Unknown')
    );
  else
    event_action := format('%s %s', event_action, entity_name);
  end if;

  target_id := coalesce(
    changed_row ->> 'id',
    changed_row ->> 'profile_id',
    changed_row ->> 'appointment_id',
    changed_row ->> 'prescription_id',
    changed_row ->> 'invoice_id'
  );

  insert into public.activity_logs (
    actor_id,
    action,
    target_table,
    target_id
  )
  values (
    auth.uid(),
    event_action,
    tg_table_name,
    target_id
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end
$$;

create or replace function private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create or replace function private.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() and new.role is distinct from old.role then
    raise exception 'Only an administrator may change a profile role';
  end if;
  return new;
end
$$;

create or replace function private.guard_appointment_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.doctor_id = (select private.current_doctor_id()) then
    if new.id is distinct from old.id
      or new.patient_id is distinct from old.patient_id
      or new.doctor_id is distinct from old.doctor_id
      or new.appointment_date is distinct from old.appointment_date
      or new.time_slot is distinct from old.time_slot
      or new.reason_of_visit is distinct from old.reason_of_visit
      or new.notes is distinct from old.notes
      or new.created_at is distinct from old.created_at then
      raise exception 'Doctors may only update appointment status';
    end if;
    return new;
  end if;

  if old.patient_id = (select private.current_patient_id())
    and old.status = 'pending' then
    if new.id is distinct from old.id
      or new.patient_id is distinct from old.patient_id
      or new.reason_of_visit is distinct from old.reason_of_visit
      or new.notes is distinct from old.notes
      or new.created_at is distinct from old.created_at then
      raise exception 'Patients may only edit their pending appointment details';
    end if;

    if new.status is distinct from old.status
      and not (
        old.appointment_date < current_date
        and new.status = 'cancelled'
        and new.doctor_id is not distinct from old.doctor_id
        and new.appointment_date is not distinct from old.appointment_date
        and new.time_slot is not distinct from old.time_slot
      ) then
      raise exception 'Patients may not change appointment status';
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this appointment';
end
$$;

create or replace function private.guard_prescription_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.doctor_id is distinct from (select private.current_doctor_id())
    or new.id is distinct from old.id
    or new.appointment_id is distinct from old.appointment_id
    or new.patient_id is distinct from old.patient_id
    or new.doctor_id is distinct from old.doctor_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Doctors may not change prescription ownership';
  end if;

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_profile_updated_at();

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function private.prevent_non_admin_role_change();

drop trigger if exists appointments_guard_update on public.appointments;
create trigger appointments_guard_update
  before update on public.appointments
  for each row execute function private.guard_appointment_update();

drop trigger if exists prescriptions_guard_update on public.prescriptions;
create trigger prescriptions_guard_update
  before update on public.prescriptions
  for each row execute function private.guard_prescription_update();

drop trigger if exists profiles_activity_log on public.profiles;
create trigger profiles_activity_log
  after insert or update or delete on public.profiles
  for each row execute function private.log_activity_change();

drop trigger if exists doctors_activity_log on public.doctors;
create trigger doctors_activity_log
  after insert or update or delete on public.doctors
  for each row execute function private.log_activity_change();

drop trigger if exists patients_activity_log on public.patients;
create trigger patients_activity_log
  after insert or update or delete on public.patients
  for each row execute function private.log_activity_change();

drop trigger if exists doctor_schedules_activity_log on public.doctor_schedules;
create trigger doctor_schedules_activity_log
  after insert or update or delete on public.doctor_schedules
  for each row execute function private.log_activity_change();

drop trigger if exists appointments_activity_log on public.appointments;
create trigger appointments_activity_log
  after insert or update or delete on public.appointments
  for each row execute function private.log_activity_change();

drop trigger if exists prescriptions_activity_log on public.prescriptions;
create trigger prescriptions_activity_log
  after insert or update or delete on public.prescriptions
  for each row execute function private.log_activity_change();

drop trigger if exists prescription_items_activity_log on public.prescription_items;
create trigger prescription_items_activity_log
  after insert or update or delete on public.prescription_items
  for each row execute function private.log_activity_change();

drop trigger if exists invoices_activity_log on public.invoices;
create trigger invoices_activity_log
  after insert or update or delete on public.invoices
  for each row execute function private.log_activity_change();

drop trigger if exists invoice_items_activity_log on public.invoice_items;
create trigger invoice_items_activity_log
  after insert or update or delete on public.invoice_items
  for each row execute function private.log_activity_change();

drop trigger if exists payments_activity_log on public.payments;
create trigger payments_activity_log
  after insert or update or delete on public.payments
  for each row execute function private.log_activity_change();

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.statuses enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.activity_logs enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on
  public.profiles,
  public.doctors,
  public.patients,
  public.doctor_schedules,
  public.statuses,
  public.appointments,
  public.prescriptions,
  public.prescription_items,
  public.invoices,
  public.invoice_items,
  public.payments,
  public.activity_logs
to authenticated, service_role;

revoke all on function private.current_app_role() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.current_doctor_id() from public;
revoke all on function private.current_patient_id() from public;
revoke all on function private.can_access_patient(uuid) from public;
revoke all on function private.can_access_patient_profile(uuid) from public;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_doctor_id() to authenticated;
grant execute on function private.current_patient_id() to authenticated;
grant execute on function private.can_access_patient(uuid) to authenticated;
grant execute on function private.can_access_patient_profile(uuid) to authenticated;

drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
  for select to authenticated
  using (
    private.can_access_patient_profile(id)
    or exists (select 1 from public.doctors d where d.profile_id = profiles.id)
  );

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin on public.profiles
  for insert to authenticated
  with check (
    private.is_admin()
    or (id = (select auth.uid()) and role = 'patient')
  );

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (private.is_admin() or id = (select auth.uid()))
  with check (private.is_admin() or id = (select auth.uid()));

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (private.is_admin());

drop policy if exists doctors_select_authenticated on public.doctors;
create policy doctors_select_authenticated on public.doctors
  for select to authenticated
  using (private.current_app_role() is not null);

drop policy if exists doctors_insert_admin on public.doctors;
create policy doctors_insert_admin on public.doctors
  for insert to authenticated with check (private.is_admin());

drop policy if exists doctors_update_admin on public.doctors;
create policy doctors_update_admin on public.doctors
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists doctors_delete_admin on public.doctors;
create policy doctors_delete_admin on public.doctors
  for delete to authenticated using (private.is_admin());

drop policy if exists patients_select_scoped on public.patients;
create policy patients_select_scoped on public.patients
  for select to authenticated using (private.can_access_patient(id));

drop policy if exists patients_insert_admin on public.patients;
create policy patients_insert_admin on public.patients
  for insert to authenticated with check (private.is_admin());

drop policy if exists patients_update_admin on public.patients;
create policy patients_update_admin on public.patients
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists patients_delete_admin on public.patients;
create policy patients_delete_admin on public.patients
  for delete to authenticated using (private.is_admin());

drop policy if exists doctor_schedules_select_authenticated on public.doctor_schedules;
create policy doctor_schedules_select_authenticated on public.doctor_schedules
  for select to authenticated
  using (private.current_app_role() is not null);

drop policy if exists doctor_schedules_insert_admin on public.doctor_schedules;
create policy doctor_schedules_insert_admin on public.doctor_schedules
  for insert to authenticated with check (private.is_admin());

drop policy if exists doctor_schedules_update_admin on public.doctor_schedules;
create policy doctor_schedules_update_admin on public.doctor_schedules
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists doctor_schedules_delete_admin on public.doctor_schedules;
create policy doctor_schedules_delete_admin on public.doctor_schedules
  for delete to authenticated using (private.is_admin());

drop policy if exists statuses_select_authenticated on public.statuses;
create policy statuses_select_authenticated on public.statuses
  for select to authenticated
  using (private.current_app_role() is not null);

drop policy if exists statuses_manage_admin on public.statuses;
create policy statuses_manage_admin on public.statuses
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists appointments_select_scoped on public.appointments;
create policy appointments_select_scoped on public.appointments
  for select to authenticated
  using (
    private.is_admin()
    or private.can_access_patient(patient_id)
    or doctor_id = (select private.current_doctor_id())
  );

drop policy if exists appointments_insert_patient_or_admin on public.appointments;
create policy appointments_insert_patient_or_admin on public.appointments
  for insert to authenticated
  with check (
    private.is_admin()
    or patient_id = (select private.current_patient_id())
  );

drop policy if exists appointments_update_scoped on public.appointments;
create policy appointments_update_scoped on public.appointments
  for update to authenticated
  using (
    private.is_admin()
    or doctor_id = (select private.current_doctor_id())
    or (
      patient_id = (select private.current_patient_id())
      and status = 'pending'
    )
  )
  with check (
    private.is_admin()
    or doctor_id = (select private.current_doctor_id())
    or (
      patient_id = (select private.current_patient_id())
      and (
        status = 'pending'
        or (status = 'cancelled' and appointment_date < current_date)
      )
    )
  );

drop policy if exists appointments_delete_admin on public.appointments;
create policy appointments_delete_admin on public.appointments
  for delete to authenticated using (private.is_admin());

drop policy if exists prescriptions_select_scoped on public.prescriptions;
create policy prescriptions_select_scoped on public.prescriptions
  for select to authenticated
  using (
    private.is_admin()
    or patient_id = (select private.current_patient_id())
    or doctor_id = (select private.current_doctor_id())
  );

drop policy if exists prescriptions_insert_doctor_or_admin on public.prescriptions;
create policy prescriptions_insert_doctor_or_admin on public.prescriptions
  for insert to authenticated
  with check (
    private.is_admin()
    or (
      doctor_id = (select private.current_doctor_id())
      and exists (
        select 1
        from public.appointments a
        where a.id = prescriptions.appointment_id
          and a.patient_id = prescriptions.patient_id
          and a.doctor_id = prescriptions.doctor_id
      )
    )
  );

drop policy if exists prescriptions_update_doctor_or_admin on public.prescriptions;
create policy prescriptions_update_doctor_or_admin on public.prescriptions
  for update to authenticated
  using (private.is_admin() or doctor_id = (select private.current_doctor_id()))
  with check (private.is_admin() or doctor_id = (select private.current_doctor_id()));

drop policy if exists prescriptions_delete_doctor_or_admin on public.prescriptions;
create policy prescriptions_delete_doctor_or_admin on public.prescriptions
  for delete to authenticated
  using (private.is_admin() or doctor_id = (select private.current_doctor_id()));

drop policy if exists prescription_items_select_scoped on public.prescription_items;
create policy prescription_items_select_scoped on public.prescription_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (
          private.is_admin()
          or p.patient_id = (select private.current_patient_id())
          or p.doctor_id = (select private.current_doctor_id())
        )
    )
  );

drop policy if exists prescription_items_insert_doctor_or_admin on public.prescription_items;
create policy prescription_items_insert_doctor_or_admin on public.prescription_items
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (
          private.is_admin()
          or p.doctor_id = (select private.current_doctor_id())
        )
    )
  );

drop policy if exists prescription_items_update_doctor_or_admin on public.prescription_items;
create policy prescription_items_update_doctor_or_admin on public.prescription_items
  for update to authenticated
  using (
    exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (private.is_admin() or p.doctor_id = (select private.current_doctor_id()))
    )
  )
  with check (
    exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (private.is_admin() or p.doctor_id = (select private.current_doctor_id()))
    )
  );

drop policy if exists prescription_items_delete_doctor_or_admin on public.prescription_items;
create policy prescription_items_delete_doctor_or_admin on public.prescription_items
  for delete to authenticated
  using (
    exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (private.is_admin() or p.doctor_id = (select private.current_doctor_id()))
    )
  );

drop policy if exists invoices_select_scoped on public.invoices;
create policy invoices_select_scoped on public.invoices
  for select to authenticated
  using (
    private.is_admin()
    or patient_id = (select private.current_patient_id())
  );

drop policy if exists invoices_manage_admin on public.invoices;
create policy invoices_manage_admin on public.invoices
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists invoice_items_select_scoped on public.invoice_items;
create policy invoice_items_select_scoped on public.invoice_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      where i.id = invoice_items.invoice_id
        and (private.is_admin() or i.patient_id = (select private.current_patient_id()))
    )
  );

drop policy if exists invoice_items_manage_admin on public.invoice_items;
create policy invoice_items_manage_admin on public.invoice_items
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists payments_select_scoped on public.payments;
create policy payments_select_scoped on public.payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      where i.id = payments.invoice_id
        and (private.is_admin() or i.patient_id = (select private.current_patient_id()))
    )
  );

drop policy if exists payments_manage_admin on public.payments;
create policy payments_manage_admin on public.payments
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists activity_logs_select_admin on public.activity_logs;
create policy activity_logs_select_admin on public.activity_logs
  for select to authenticated using (private.is_admin());

insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do update set public = false;

drop policy if exists images_authenticated_read on storage.objects;
create policy images_authenticated_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'images'
    and (
      private.is_admin()
      or (
        private.current_app_role() is not null
        and (storage.foldername(name))[1] = case private.current_app_role()
          when 'admin' then 'Admin'
          when 'doctor' then 'Doctors'
          else 'Patients'
        end
        and storage.filename(name) like
          ('%-' || left((select auth.uid())::text, 8) || '.png')
      )
    )
  );

drop policy if exists images_insert_admin_or_owner on storage.objects;
create policy images_insert_admin_or_owner on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images'
    and (
      private.is_admin()
      or (
        private.current_app_role() is not null
        and (storage.foldername(name))[1] = case private.current_app_role()
          when 'admin' then 'Admin'
          when 'doctor' then 'Doctors'
          else 'Patients'
        end
        and storage.filename(name) like
          ('%-' || left((select auth.uid())::text, 8) || '.png')
      )
    )
  );

drop policy if exists images_update_admin_or_owner on storage.objects;
create policy images_update_admin_or_owner on storage.objects
  for update to authenticated
  using (
    bucket_id = 'images'
    and (
      private.is_admin()
      or (
        private.current_app_role() is not null
        and (storage.foldername(name))[1] = case private.current_app_role()
          when 'admin' then 'Admin'
          when 'doctor' then 'Doctors'
          else 'Patients'
        end
        and storage.filename(name) like
          ('%-' || left((select auth.uid())::text, 8) || '.png')
      )
    )
  )
  with check (
    bucket_id = 'images'
    and (
      private.is_admin()
      or (
        private.current_app_role() is not null
        and (storage.foldername(name))[1] = case private.current_app_role()
          when 'admin' then 'Admin'
          when 'doctor' then 'Doctors'
          else 'Patients'
        end
        and storage.filename(name) like
          ('%-' || left((select auth.uid())::text, 8) || '.png')
      )
    )
  );

drop policy if exists images_delete_admin_or_owner on storage.objects;
create policy images_delete_admin_or_owner on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'images'
    and (
      private.is_admin()
      or (
        private.current_app_role() is not null
        and (storage.foldername(name))[1] = case private.current_app_role()
          when 'admin' then 'Admin'
          when 'doctor' then 'Doctors'
          else 'Patients'
        end
        and storage.filename(name) like
          ('%-' || left((select auth.uid())::text, 8) || '.png')
      )
    )
  );
