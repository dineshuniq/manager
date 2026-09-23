import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type Priority, type Stage, type WorkItemType } from "@/lib/types";
import type { Profile } from "@/lib/types";

export function StageBadge({ stage }: { stage: Stage }) {
  const colors: Record<Stage, string> = {
    UNASSIGNED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[stage])}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variants: Record<Priority, "secondary" | "outline" | "default" | "destructive"> = {
    LOW: "outline",
    MEDIUM: "secondary",
    HIGH: "default",
    URGENT: "destructive",
  };
  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

export function TypeBadge({ type }: { type: WorkItemType }) {
  const labels: Record<WorkItemType, string> = { STORY: "Story", TASK: "Task", SUBTASK: "Subtask" };
  return <Badge variant="outline">{labels[type]}</Badge>;
}

export function AssigneeAvatar({ profile, size = "sm" }: { profile: Profile | null | undefined; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "size-6" : "size-8";
  if (!profile) {
    return (
      <Avatar className={dim} title="Unassigned">
        <AvatarFallback className="text-[10px]">?</AvatarFallback>
      </Avatar>
    );
  }
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Avatar className={dim} title={profile.name}>
      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
    </Avatar>
  );
}
