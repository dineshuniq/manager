"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CornerDownRight } from "lucide-react";
import { AssigneeAvatar, PRIORITY_STYLES, PriorityBadge, ProgressBar, TypeBadge } from "@/components/shared/badges";
import { dueDateState, formatDue } from "@/components/work-item/property-pickers";
import type { Profile, WorkItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CardMeta {
  assignee: Profile | null;
  parentTitle: string | null;
  childDone: number;
  childTotal: number;
}

export function CardFace({
  item,
  meta,
  overlay = false,
}: {
  item: WorkItem;
  meta: CardMeta;
  overlay?: boolean;
}) {
  const due = item.due_date ? dueDateState(item.due_date, item.stage) : "none";
  const done = item.stage === "COMPLETED";

  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-xl border bg-card p-3 pl-4 transition-all duration-200",
        overlay
          ? "rotate-[2.5deg] scale-[1.04] cursor-grabbing border-brand/40 shadow-2xl ring-2 ring-brand/30"
          : "cursor-grab shadow-sm hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lift active:cursor-grabbing"
      )}
    >
      <span className={cn("absolute inset-y-2 left-1.5 w-[3px] rounded-full", PRIORITY_STYLES[item.priority].edge)} />

      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={item.type} />
        <PriorityBadge priority={item.priority} />
      </div>

      {meta.parentTitle && (
        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
          <CornerDownRight className="size-3 shrink-0" />
          <span className="truncate">{meta.parentTitle}</span>
        </p>
      )}

      <p className={cn("mt-1.5 text-sm font-medium leading-snug [overflow-wrap:anywhere]", done && "text-muted-foreground line-through decoration-stage-done/60")}>
        {item.title}
      </p>

      {meta.childTotal > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {meta.childDone}/{meta.childTotal} {item.type === "STORY" ? "Tasks" : "Subtasks"} complete
            </span>
            <span className="tabular-nums">{Math.round((meta.childDone / meta.childTotal) * 100)}%</span>
          </div>
          <ProgressBar value={(meta.childDone / meta.childTotal) * 100} className="h-1" />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {item.due_date ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              due === "overdue" && "bg-destructive/12 text-destructive",
              due === "soon" && "bg-stage-review/15 text-stage-review",
              due === "none" && "text-muted-foreground"
            )}
          >
            <CalendarDays className="size-3" />
            {formatDue(item.due_date)}
          </span>
        ) : (
          <span />
        )}
        <AssigneeAvatar profile={meta.assignee} />
      </div>
    </div>
  );
}

export const KanbanCard = memo(function KanbanCard({
  item,
  meta,
  index,
  disabled,
  onOpen,
}: {
  item: WorkItem;
  meta: CardMeta;
  index: number;
  disabled: boolean;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        animationDelay: `${Math.min(index, 8) * 35}ms`,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(item.id)}
      className={cn("animate-fade-up outline-none", isDragging && "opacity-40")}
    >
      {isDragging ? (
        <div className="h-full min-h-24 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5" />
      ) : (
        <CardFace item={item} meta={meta} />
      )}
    </div>
  );
});
