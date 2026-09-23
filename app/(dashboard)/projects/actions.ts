"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { canCreateProject } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
}

const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  managerIds: z.array(z.string().uuid()).default([]),
  developerIds: z.array(z.string().uuid()).default([]),
});

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireProfile();
  if (!canCreateProject(profile)) {
    return { error: "Only Admins and Managers can create projects." };
  }

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    managerIds: formData.getAll("managerIds").map(String),
    developerIds: formData.getAll("developerIds").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, description, managerIds, developerIds } = parsed.data;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ title, description: description || null, created_by: profile.id })
    .select("id")
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Failed to create project." };
  }

  // The creator always manages their project; a person is either a Manager or a Developer, never both.
  const managers = new Set([profile.id, ...managerIds]);
  const developers = new Set(developerIds.filter((id) => !managers.has(id)));
  const members = [
    ...[...managers].map((id) => ({ project_id: project.id, user_id: id, member_role: "MANAGER" as const })),
    ...[...developers].map((id) => ({ project_id: project.id, user_id: id, member_role: "DEVELOPER" as const })),
  ];

  if (members.length > 0) {
    const { error: memberError } = await supabase.from("project_members").insert(members);
    if (memberError) {
      return { error: `Project created, but failed to add members: ${memberError.message}` };
    }
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}/board`);
}

const memberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  memberRole: z.enum(["MANAGER", "DEVELOPER"]),
});

export async function addProjectMember(input: z.infer<typeof memberSchema>) {
  const parsed = memberSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert(
    {
      project_id: parsed.projectId,
      user_id: parsed.userId,
      member_role: parsed.memberRole,
    },
    { onConflict: "project_id,user_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${parsed.projectId}`, "layout");
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`, "layout");
}
