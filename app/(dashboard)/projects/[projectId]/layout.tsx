import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProjectContext } from "@/lib/data/project";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { AvatarStack, ProgressRing } from "@/components/shared/badges";
import { ProjectTabs } from "./project-tabs";
import { MembersDialog } from "./members-dialog";

function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project, members, memberRole, workItems } = await getProjectContext(projectId);

  const canManage = memberRole === "ADMIN" || memberRole === "MANAGER";

  let allUsers: Profile[] = [];
  if (canManage) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("*").eq("status", "ACTIVE").order("name");
    allUsers = (data as Profile[]) ?? [];
  }

  const done = workItems.filter((i) => i.stage === "COMPLETED").length;
  const total = workItems.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const h = hue(project.id);

  return (
    <div className="flex min-h-svh flex-col md:min-h-svh">
      <div className="glass sticky top-14 z-20 border-b md:top-0">
        <div className="px-4 pt-5 sm:px-6">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/projects" className="transition-colors hover:text-foreground">
              Projects
            </Link>
            <ChevronRight className="size-3" />
            <span className="truncate text-foreground">{project.title}</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 animate-fade-up">
              <span
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, oklch(0.68 0.18 ${h}), oklch(0.55 0.2 ${(h + 45) % 360}))` }}
              >
                {project.title.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h1>
                {project.description && (
                  <p className="truncate text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border bg-surface/60 px-3 py-1.5" title={`${done} of ${total} completed`}>
                <ProgressRing done={done} total={total} size={20} />
                <span className="text-sm font-semibold tabular-nums">{pct}%</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {done}/{total} done
                </span>
              </div>
              {members.length > 0 && (
                <div className="hidden sm:block">
                  <AvatarStack people={members} size="sm" max={5} />
                </div>
              )}
              {canManage && <MembersDialog projectId={projectId} members={members} allUsers={allUsers} />}
            </div>
          </div>
        </div>
        <ProjectTabs projectId={projectId} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
