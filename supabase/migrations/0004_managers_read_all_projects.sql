-- Every Project Manager can *see* every project (plus its members and work
-- items). Write policies are unchanged and still require membership, so a
-- Manager who isn't involved in a project gets read-only access.
drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member"
  on public.projects for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_admin()
    or public.current_role() = 'MANAGER'
    or public.is_project_member(id)
  );

drop policy if exists "project_members_select" on public.project_members;
create policy "project_members_select"
  on public.project_members for select
  to authenticated
  using (
    public.is_admin()
    or public.current_role() = 'MANAGER'
    or public.is_project_member(project_id)
  );

drop policy if exists "work_items_select_member" on public.work_items;
create policy "work_items_select_member"
  on public.work_items for select
  to authenticated
  using (
    public.is_admin()
    or public.current_role() = 'MANAGER'
    or public.is_project_member(project_id)
  );
