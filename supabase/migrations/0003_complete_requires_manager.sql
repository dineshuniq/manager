-- Moving a work item into COMPLETED is a sign-off step reserved for the project's
-- Managers (and System Admins). Enforced here so no client can bypass it.
-- auth.uid() is null for service-role/maintenance writes, which are trusted.
create or replace function public.enforce_complete_requires_manager()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage = 'COMPLETED'
     and (tg_op = 'INSERT' or old.stage is distinct from 'COMPLETED')
     and auth.uid() is not null
     and not (public.is_admin() or public.is_project_manager(new.project_id)) then
    raise exception 'Only project managers can mark work as Completed.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists work_items_complete_requires_manager on public.work_items;

create trigger work_items_complete_requires_manager
  before insert or update of stage on public.work_items
  for each row execute function public.enforce_complete_requires_manager();
