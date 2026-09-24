import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
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
  const readOnly = memberRole === null;

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
      {/* Mobile: only the tab bar sticks (display: contents lets it stick to the page).
          Desktop: the whole header sticks. */}
      <div className="contents md:sticky md:top-0 md:z-20 md:block md:border-b md:bg-background/70 md:backdrop-blur-xl">
        <div className="px-4 pt-3 sm:px-6 md:pt-5">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/projects" className="-my-1 py-1 transition-colors hover:text-foreground">
              Projects
            </Link>
            <ChevronRight className="size-3" />
            <span className="truncate text-foreground">{project.title}</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 md:mt-3">
            <div className="flex min-w-0 items-center gap-3 animate-fade-up">
              <span
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm sm:size-11"
                style={{ background: `linear-gradient(135deg, oklch(0.68 0.18 ${h}), oklch(0.55 0.2 ${(h + 45) % 360}))` }}
              >
                {project.title.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">{project.title}</h1>
                {project.description && (
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {readOnly && (
                <span
                  title="You're not a member of this project"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stage-review/30 bg-stage-review/10 px-3 py-1.5 text-xs font-semibold text-stage-review"
                >
                  <Eye className="size-3.5" /> View only
                </span>
              )}
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
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 mt-3 border-b bg-background/80 backdrop-blur-xl md:static md:mt-0 md:border-0 md:bg-transparent md:backdrop-blur-none">
          <ProjectTabs projectId={projectId} />
        </div>
      </div>
      {readOnly && (
        <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-dashed border-stage-review/40 bg-stage-review/5 px-3.5 py-2.5 text-xs text-muted-foreground sm:mx-6">
          <Eye className="mt-px size-4 shrink-0 text-stage-review" />
          <p>
            <span className="font-semibold text-foreground">You&apos;re viewing this project read-only.</span> You can browse
            its stories and tasks, but only its members can make changes. Ask one of its managers to add you.
          </p>
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
