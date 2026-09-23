import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateProject } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Your projects and their work items.</p>
        </div>
        {canCreateProject(profile) && (
          <Button render={<Link href="/projects/new" />} className="gap-2">
            <Plus className="size-4" /> New project
          </Button>
        )}
      </div>

      {(!projects || projects.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FolderKanban className="mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            {canCreateProject(profile) ? "Create your first project to get started." : "Ask a Manager to add you to a project."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(projects as Project[] | null)?.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}/board`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
