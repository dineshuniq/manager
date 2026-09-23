-- Project Manager App — initial schema, RBAC helpers, RLS policies
create extension if not exists pgcrypto;

-- =========================================================================
-- Tables
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  name text not null,
  email text,
  avatar_url text,
  role text not null default 'DEVELOPER' check (role in ('ADMIN', 'MANAGER', 'DEVELOPER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null check (member_role in ('MANAGER', 'DEVELOPER')),
  primary key (project_id, user_id)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_id uuid references public.work_items (id) on delete cascade,
  type text not null check (type in ('STORY', 'TASK', 'SUBTASK')),
  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  stage text not null default 'UNASSIGNED' check (stage in ('UNASSIGNED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED')),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date date,
  position int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index work_items_project_id_idx on public.work_items (project_id);
create index work_items_parent_id_idx on public.work_items (parent_id);
create index work_items_assignee_id_idx on public.work_items (assignee_id);
create index work_items_stage_idx on public.work_items (stage);
create index project_members_user_id_idx on public.project_members (user_id);

-- =========================================================================
-- Triggers
-- =========================================================================

-- Auto-create a profile row whenever a user is created via the Auth Admin API.
-- Username/name/role travel in raw_user_meta_data since users are provisioned
-- by an Admin, not via self-signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'real_email', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'DEVELOPER')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enforce STORY / TASK / SUBTASK parent-type hierarchy (cross-row, so a plain
-- CHECK constraint can't express it) and keep updated_at current.
create or replace function public.check_work_item_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_type text;
begin
  if new.type = 'STORY' then
    if new.parent_id is not null then
      raise exception 'STORY items cannot have a parent';
    end if;
  elsif new.type = 'TASK' then
    if new.parent_id is null then
      raise exception 'TASK items require a STORY parent';
    end if;
    select type into parent_type from public.work_items where id = new.parent_id;
    if parent_type is distinct from 'STORY' then
      raise exception 'TASK parent must be a STORY';
    end if;
  elsif new.type = 'SUBTASK' then
    if new.parent_id is null then
      raise exception 'SUBTASK items require a TASK parent';
    end if;
    select type into parent_type from public.work_items where id = new.parent_id;
    if parent_type is distinct from 'TASK' then
      raise exception 'SUBTASK parent must be a TASK';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;

  return new;
end;
$$;

create trigger work_items_hierarchy_check
  before insert or update on public.work_items
  for each row execute function public.check_work_item_hierarchy();

-- =========================================================================
-- RBAC helper functions (security definer so policies can call them without
-- triggering recursive RLS evaluation on profiles / project_members)
-- =========================================================================

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  ) or exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.created_by = auth.uid()
  );
$$;

create or replace function public.is_project_manager(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid() and pm.member_role = 'MANAGER'
  ) or exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.created_by = auth.uid()
  );
$$;

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.work_items enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.projects, public.project_members, public.work_items to authenticated;
grant execute on function public.current_role, public.is_admin, public.is_project_member(uuid), public.is_project_manager(uuid) to authenticated;

-- profiles: everyone signed in can read (avatars/assignee pickers); only Admin writes
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- projects
create policy "projects_select_member"
  on public.projects for select
  to authenticated
  using (public.is_admin() or public.is_project_member(id));

create policy "projects_insert_admin_manager"
  on public.projects for insert
  to authenticated
  with check (public.is_admin() or public.current_role() = 'MANAGER');

create policy "projects_update_admin_manager"
  on public.projects for update
  to authenticated
  using (public.is_admin() or public.is_project_manager(id))
  with check (public.is_admin() or public.is_project_manager(id));

create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- project_members
create policy "project_members_select"
  on public.project_members for select
  to authenticated
  using (public.is_admin() or public.is_project_member(project_id));

create policy "project_members_insert_admin_manager"
  on public.project_members for insert
  to authenticated
  with check (public.is_admin() or public.is_project_manager(project_id));

create policy "project_members_update_admin_manager"
  on public.project_members for update
  to authenticated
  using (public.is_admin() or public.is_project_manager(project_id))
  with check (public.is_admin() or public.is_project_manager(project_id));

create policy "project_members_delete_admin_manager"
  on public.project_members for delete
  to authenticated
  using (public.is_admin() or public.is_project_manager(project_id));

-- work_items
create policy "work_items_select_member"
  on public.work_items for select
  to authenticated
  using (public.is_admin() or public.is_project_member(project_id));

create policy "work_items_insert_member"
  on public.work_items for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_project_manager(project_id)
    or (type in ('TASK', 'SUBTASK') and public.is_project_member(project_id))
  );

create policy "work_items_update_member"
  on public.work_items for update
  to authenticated
  using (public.is_admin() or public.is_project_member(project_id))
  with check (public.is_admin() or public.is_project_member(project_id));

create policy "work_items_delete_manager_admin"
  on public.work_items for delete
  to authenticated
  using (public.is_admin() or public.is_project_manager(project_id));
