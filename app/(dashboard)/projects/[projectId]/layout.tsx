import Link from "next/link";
import { getProjectContext } from "@/lib/data/project";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProjectTabs } from "./project-tabs";
import { MembersDialog } from "./members-dialog";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project, members, memberRole } = await getProjectContext(projectId);

  const canManage = memberRole === "ADMIN" || memberRole === "MANAGER";

  let allUsers: Profile[] = [];
  if (canManage) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("status", "ACTIVE").order("name");
    allUsers = (data as Profile[]) ?? [];
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/projects" className="text-sm text-muted-foreground hover:underline">
              ← Projects
            </Link>
            <h1 className="text-xl font-semibold">{project.title}</h1>
          </div>
          {canManage && (
            <MembersDialog projectId={projectId} members={members} allUsers={allUsers} />
          )}
        </div>
        <ProjectTabs projectId={projectId} />
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
