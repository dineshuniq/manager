import { cn } from "@/lib/utils";
import { STAGE_LABELS, type Priority, type Profile, type Stage, type WorkItemType } from "@/lib/types";
import { BookOpen, CheckSquare, ListTree, Flame, ArrowUp, Minus, ArrowDown } from "lucide-react";

export const STAGE_STYLES: Record<Stage, { dot: string; pill: string; bar: string; ring: string }> = {
  UNASSIGNED: {
    dot: "bg-stage-todo",
    pill: "bg-stage-todo/12 text-stage-todo ring-stage-todo/25",
    bar: "bg-stage-todo",
    ring: "ring-stage-todo/40",
  },
  IN_PROGRESS: {
    dot: "bg-stage-progress",
    pill: "bg-stage-progress/12 text-stage-progress ring-stage-progress/25",
    bar: "bg-stage-progress",
    ring: "ring-stage-progress/40",
  },
  REVIEW: {
    dot: "bg-stage-review",
    pill: "bg-stage-review/14 text-stage-review ring-stage-review/30",
    bar: "bg-stage-review",
    ring: "ring-stage-review/40",
  },
  COMPLETED: {
    dot: "bg-stage-done",
    pill: "bg-stage-done/12 text-stage-done ring-stage-done/25",
    bar: "bg-stage-done",
    ring: "ring-stage-done/40",
  },
};

export const PRIORITY_STYLES: Record<Priority, { pill: string; edge: string; label: string }> = {
  LOW: { pill: "bg-prio-low/12 text-prio-low ring-prio-low/25", edge: "bg-prio-low", label: "Low" },
  MEDIUM: { pill: "bg-prio-medium/12 text-prio-medium ring-prio-medium/25", edge: "bg-prio-medium", label: "Medium" },
  HIGH: { pill: "bg-prio-high/14 text-prio-high ring-prio-high/30", edge: "bg-prio-high", label: "High" },
  URGENT: { pill: "bg-prio-urgent/14 text-prio-urgent ring-prio-urgent/30", edge: "bg-prio-urgent", label: "Urgent" },
};

const PRIORITY_ICON: Record<Priority, typeof Flame> = {
  LOW: ArrowDown,
  MEDIUM: Minus,
  HIGH: ArrowUp,
  URGENT: Flame,
};

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const s = STAGE_STYLES[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot, stage === "IN_PROGRESS" && "animate-pulse")} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const s = PRIORITY_STYLES[priority];
  const Icon = PRIORITY_ICON[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        s.pill,
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

const TYPE_STYLES: Record<WorkItemType, { label: string; icon: typeof BookOpen; cls: string }> = {
  STORY: { label: "Story", icon: BookOpen, cls: "bg-brand/12 text-brand ring-brand/25" },
  TASK: { label: "Task", icon: CheckSquare, cls: "bg-stage-progress/12 text-stage-progress ring-stage-progress/25" },
  SUBTASK: { label: "Subtask", icon: ListTree, cls: "bg-brand-3/12 text-brand-3 ring-brand-3/25" },
};

export function TypeBadge({ type, compact = false }: { type: WorkItemType; compact?: boolean }) {
  const t = TYPE_STYLES[type];
  const Icon = t.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        t.cls
      )}
      title={t.label}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {!compact && t.label}
    </span>
  );
}

function hashHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AssigneeAvatar({
  profile,
  size = "sm",
  className,
}: {
  profile: Pick<Profile, "id" | "name"> | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" }[size];

  if (!profile) {
    return (
      <span
        title="Unassigned"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground",
          dim,
          className
        )}
      >
        ?
      </span>
    );
  }

  const hue = hashHue(profile.id + profile.name);
  return (
    <span
      title={profile.name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ring-background",
        dim,
        className
      )}
      style={{
        background: `linear-gradient(135deg, oklch(0.68 0.17 ${hue}), oklch(0.55 0.2 ${(hue + 50) % 360}))`,
      }}
    >
      {initials(profile.name)}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
  size = "sm",
}: {
  people: Pick<Profile, "id" | "name">[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <AssigneeAvatar key={p.id} profile={p} size={size} className="transition-transform hover:z-10 hover:-translate-y-0.5" />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-background",
            size === "md" ? "size-8 text-xs" : size === "sm" ? "size-6 text-[10px]" : "size-5 text-[9px]"
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "done" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "done" || pct === 100 ? "bg-stage-done" : "bg-brand-gradient"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({ done, total, size = 18 }: { done: number; total: number; size?: number }) {
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={2.5} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className={cn("transition-[stroke-dashoffset] duration-700 ease-out", pct === 1 ? "stroke-stage-done" : "stroke-brand")}
      />
    </svg>
  );
}
