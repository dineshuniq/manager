-- INSERT ... RETURNING re-checks the SELECT policy against the new row, but
-- is_project_member() queries projects under the statement's snapshot and can't
-- see a row inserted by that same statement. Non-admin creators were therefore
-- rejected. Checking created_by directly on the row fixes it.
drop policy if exists "projects_select_member" on public.projects;

create policy "projects_select_member"
  on public.projects for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin() or public.is_project_member(id));
