-- Run in Supabase SQL Editor with an administrator account.
-- Activity records are stored in one private JSON document with an atomic version check.
-- This focused classroom schema is separate from the full thesis relational schema.
create table if not exists public.activity_members (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  role text not null check (role in ('staff', 'volunteer')),
  senior boolean not null default false
);
alter table public.activity_members enable row level security;
revoke all on public.activity_members from anon, authenticated;
grant all on public.activity_members to service_role;

create table if not exists public.activity_state (
  id integer primary key check (id = 1),
  data jsonb not null,
  version bigint not null default 0
);
alter table public.activity_state enable row level security;
revoke all on public.activity_state from anon, authenticated;
grant all on public.activity_state to service_role;
insert into public.activity_state (id, data) values (1, '{"events":[],"profiles":{},"submissions":[]}') on conflict do nothing;

create or replace function public.activity_compare_and_swap(expected_version bigint, new_data jsonb)
returns boolean language plpgsql security invoker set search_path = public as $$
declare changed integer;
begin
  update public.activity_state set data = new_data, version = version + 1 where id = 1 and version = expected_version;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.activity_compare_and_swap(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.activity_compare_and_swap(bigint,jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('activity-evidence', 'activity-evidence', false, 5242880, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No anonymous/authenticated storage policies are needed: authorized downloads and uploads
-- go through the Node backend, which checks the session and record ownership.

-- Provision users with Dashboard > Authentication > Users, then add their UUIDs:
-- insert into public.activity_members (id, name, role, senior) values
-- ('AUTH-USER-UUID', 'Your volunteer name', 'volunteer', false),
-- ('AUTH-STAFF-UUID', 'Your staff name', 'staff', false);
