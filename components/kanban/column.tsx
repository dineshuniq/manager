"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./card";
import type { Profile, Stage, WorkItem } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  stage,
  items,
  profileById,
  titleById,
  completionById,
}: {
  stage: Stage;
  items: WorkItem[];
  profileById: Map<string, Profile>;
  titleById: Map<string, string>;
  completionById: Map<string, string | null>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              assignee={item.assignee_id ? (profileById.get(item.assignee_id) ?? null) : null}
              parentTitle={item.parent_id ? (titleById.get(item.parent_id) ?? null) : null}
              completion={completionById.get(item.id) ?? null}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
