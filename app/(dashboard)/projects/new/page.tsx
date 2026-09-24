import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-6 sm:px-8 sm:py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <div className="mt-4 animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">Name it, describe it, and pick your team.</p>
      </div>
      <NewProjectForm users={(users as Profile[]) ?? []} currentUserId={profile.id} />
    </div>
  );
}
