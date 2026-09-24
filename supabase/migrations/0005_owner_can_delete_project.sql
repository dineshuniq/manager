-- A project's owner (its creator) may delete it; System Admins still can too.
-- Work items and memberships go with it via ON DELETE CASCADE.
drop policy if exists "projects_delete_admin" on public.projects;
drop policy if exists "projects_delete_owner_admin" on public.projects;

create policy "projects_delete_owner_admin"
  on public.projects for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());
