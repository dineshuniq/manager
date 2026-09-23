import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, ProjectMemberRole, WorkItem } from "@/lib/types";

export interface ProjectContext {
  project: Project;
  profile: Profile;
  memberRole: ProjectMemberRole | "ADMIN" | null;
  members: (Profile & { member_role: ProjectMemberRole })[];
  workItems: WorkItem[];
}

export async function getProjectContext(projectId: string): Promise<ProjectContext> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: memberRows }, { data: workItems }] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, user_id, member_role, profile:profiles(*)")
      .eq("project_id", projectId),
    supabase
      .from("work_items")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
  ]);

  const members = (memberRows ?? []).map((m) => ({
    ...(m.profile as unknown as Profile),
    member_role: m.member_role as ProjectMemberRole,
  }));

  const memberRole: ProjectContext["memberRole"] =
    profile.role === "ADMIN"
      ? "ADMIN"
      : (members.find((m) => m.id === profile.id)?.member_role ?? null);

  return {
    project: project as Project,
    profile,
    memberRole,
    members,
    workItems: (workItems as WorkItem[]) ?? [],
  };
}
