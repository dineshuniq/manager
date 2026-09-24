import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CheckCircle2, CircleDashed, Eye, FolderKanban, Layers, Plus, Timer } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateProject } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { STAGES, STAGE_LABELS, type Profile, type Project, type Stage } from "@/lib/types";
import { AssigneeAvatar, AvatarStack, ProgressBar, STAGE_STYLES } from "@/components/shared/badges";
import { cn } from "@/lib/utils";
import { Fab } from "@/components/shell/fab";

function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { view } = await searchParams;

  const supabase = await createClient();
  const [{ data: projects }, { data: items }, { data: memberRows }] = await Promise.all([
    supabase.from("projects").select("*, owner:profiles!created_by(id, name, username)").order("created_at", { ascending: false }),
    supabase.from("work_items").select("project_id, stage"),
    supabase.from("project_members").select("project_id, member_role, profile:profiles(id, name)"),
  ]);

  const stats = new Map<string, Record<Stage, number>>();
  for (const it of items ?? []) {
    const s = stats.get(it.project_id) ?? { UNASSIGNED: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
    s[it.stage as Stage]++;
    stats.set(it.project_id, s);
  }
  const members = new Map<string, Pick<Profile, "id" | "name">[]>();
  // Fallback "owner" for projects whose creator account was deleted.
  const firstManager = new Map<string, Pick<Profile, "id" | "name">>();
  for (const m of memberRows ?? []) {
    const list = members.get(m.project_id) ?? [];
    const person = m.profile as unknown as Pick<Profile, "id" | "name"> | null;
    if (person) {
      list.push(person);
      if (m.member_role === "MANAGER" && !firstManager.has(m.project_id)) firstManager.set(m.project_id, person);
    }
    members.set(m.project_id, list);
  }

  // Managers and Admins see every project; "involved" = creator or member.
  const canBrowseAll = profile.role === "ADMIN" || profile.role === "MANAGER";
  const involved = new Set(
    (projects ?? [])
      .filter((p) => p.created_by === profile.id || (members.get(p.id) ?? []).some((m) => m.id === profile.id))
      .map((p) => p.id)
  );
  const showMine = canBrowseAll && view === "mine";
  const shown = ((projects as Project[] | null) ?? []).filter((p) => !showMine || involved.has(p.id));
  const shownIds = new Set(shown.map((p) => p.id));
  const shownItems = (items ?? []).filter((it) => shownIds.has(it.project_id));

  const totals = { UNASSIGNED: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 } as Record<Stage, number>;
  for (const it of shownItems) totals[it.stage as Stage]++;
  const totalItems = shownItems.length;

  const tiles = [
    { label: showMine ? "My projects" : "Projects", value: shown.length, icon: FolderKanban, cls: "text-brand bg-brand/12" },
    { label: "Open items", value: totalItems - totals.COMPLETED, icon: CircleDashed, cls: "text-stage-todo bg-stage-todo/12" },
    { label: "In progress", value: totals.IN_PROGRESS + totals.REVIEW, icon: Timer, cls: "text-stage-progress bg-stage-progress/12" },
    { label: "Completed", value: totals.COMPLETED, icon: CheckCircle2, cls: "text-stage-done bg-stage-done/12" },
  ];

  const firstName = profile.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Here&apos;s what&apos;s moving across your projects.</p>
        </div>
        {canCreateProject(profile) && (
          <Link
            href="/projects/new"
            className="group hidden h-10 items-center gap-2 self-start rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] sm:inline-flex sm:self-auto"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            New project
          </Link>
        )}
      </div>

      <div className="stagger mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card/70 p-3.5 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
              <span className={cn("inline-flex size-7 items-center justify-center rounded-lg", t.cls)}>
                <t.icon className="size-3.5" />
              </span>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight sm:mt-3 sm:text-2xl">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 sm:mt-10">
        <h2 className="text-sm font-semibold">{showMine ? "My projects" : "All projects"}</h2>
        {canBrowseAll ? (
          <div className="flex h-9 items-center rounded-xl border bg-surface/60 p-1 text-xs font-medium">
            {[
              { key: "all", label: "All", count: projects?.length ?? 0, href: "/projects" },
              { key: "mine", label: "Mine", count: involved.size, href: "/projects?view=mine" },
            ].map((t) => {
              const on = (t.key === "mine") === showMine;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  scroll={false}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "inline-flex h-full min-w-16 items-center justify-center gap-1.5 rounded-lg px-3 transition-colors",
                    on ? "bg-accent text-foreground shadow-sm ring-1 ring-brand/15" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  <span className="rounded-md bg-muted px-1.5 tabular-nums text-muted-foreground">{t.count}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{shown.length} total</p>
        )}
      </div>

      {shown.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-3xl border border-dashed bg-card/40 px-6 py-20 text-center animate-fade-up">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-brand/20 blur-xl" />
            <span className="relative inline-flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <Layers className="size-6" />
            </span>
          </div>
          <p className="mt-5 text-base font-semibold">{showMine ? "You’re not on any projects yet" : "No projects yet"}</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {canCreateProject(profile)
              ? "Create your first project to start organising stories, tasks, and subtasks."
              : "Ask a Project Manager to add you to a project."}
          </p>
          {canCreateProject(profile) && (
            <Link
              href="/projects/new"
              className="mt-6 inline-flex h-9 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              <Plus className="size-4" /> Create project
            </Link>
          )}
        </div>
      )}

      <div className="stagger mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((project) => {
          const s = stats.get(project.id) ?? { UNASSIGNED: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
          const total = STAGES.reduce((sum, st) => sum + s[st], 0);
          const pct = total ? Math.round((s.COMPLETED / total) * 100) : 0;
          const h = hue(project.id);
          const people = members.get(project.id) ?? [];

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card/80 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                style={{ background: `oklch(0.66 0.2 ${h})` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, oklch(0.68 0.18 ${h}), oklch(0.55 0.2 ${(h + 45) % 360}))` }}
                >
                  {project.title.slice(0, 1).toUpperCase()}
                </span>
                {canBrowseAll && profile.role !== "ADMIN" && !involved.has(project.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-stage-review/30 bg-stage-review/10 px-2 py-1 text-[11px] font-semibold text-stage-review">
                    <Eye className="size-3" /> View only
                  </span>
                ) : (
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                )}
              </div>
              <h3 className="relative mt-4 line-clamp-1 font-semibold tracking-tight">{project.title}</h3>
              {(() => {
                const owner = project.owner ?? firstManager.get(project.id) ?? null;
                if (!owner) return null;
                return (
                  <p className="relative mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <AssigneeAvatar profile={owner} size="xs" className="ring-0" />
                    <span className="truncate">
                      {project.owner ? "Owner" : "Managed by"}{" "}
                      <span className="font-medium text-foreground">{owner.id === profile.id ? "You" : owner.name}</span>
                    </span>
                  </p>
                );
              })()}
              <p className="relative mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {project.description || "No description yet."}
              </p>

              <div className="relative mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{total} items</span>
                  <span className="font-semibold tabular-nums">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                  {total > 0 &&
                    STAGES.map((st) =>
                      s[st] ? (
                        <div
                          key={st}
                          title={`${STAGE_LABELS[st]}: ${s[st]}`}
                          className={cn("h-full", STAGE_STYLES[st].bar)}
                          style={{ width: `${(s[st] / total) * 100}%` }}
                        />
                      ) : null
                    )}
                </div>
              </div>

              <div className="relative mt-5 flex items-center justify-between border-t pt-4">
                {people.length ? <AvatarStack people={people} size="sm" /> : <span className="text-xs text-muted-foreground">No members</span>}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {STAGES.slice(1).map((st) => (
                    <span key={st} className="inline-flex items-center gap-1" title={STAGE_LABELS[st]}>
                      <span className={cn("size-1.5 rounded-full", STAGE_STYLES[st].dot)} />
                      {s[st]}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {canCreateProject(profile) && <Fab href="/projects/new" label="New project" />}
    </div>
  );
}
