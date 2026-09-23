import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateProject } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { NewProjectForm } from "./new-project-form";

export default async function NewProjectPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canCreateProject(profile)) redirect("/projects");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "ACTIVE")
    .order("name");

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">New project</h1>
      <NewProjectForm users={(users as Profile[]) ?? []} currentUserId={profile.id} />
    </div>
  );
}
