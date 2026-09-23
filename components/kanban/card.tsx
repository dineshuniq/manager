"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AssigneeAvatar, PriorityBadge, TypeBadge } from "@/components/shared/badges";
import type { Profile, WorkItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KanbanCard({
  item,
  assignee,
  parentTitle,
  completion,
}: {
  item: WorkItem;
  assignee: Profile | null;
  parentTitle: string | null;
  completion: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab space-y-2 rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <TypeBadge type={item.type} />
        <PriorityBadge priority={item.priority} />
      </div>
      {parentTitle && <p className="truncate text-xs text-muted-foreground">{parentTitle}</p>}
      <p className="text-sm font-medium">{item.title}</p>
      <div className="flex items-center justify-between">
        {completion ? (
          <span className="text-xs text-muted-foreground">{completion} Subtasks complete</span>
        ) : (
          <span />
        )}
        <AssigneeAvatar profile={assignee} />
      </div>
    </div>
  );
}
