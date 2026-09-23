"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { updateWorkItem } from "@/app/(dashboard)/projects/[projectId]/actions";
import { STAGES, type Profile, type ProjectMemberRole, type Stage, type WorkItem } from "@/lib/types";
import { KanbanColumn } from "./column";
import { FilterBar, type KanbanFilters } from "./filter-bar";

type Member = Profile & { member_role: ProjectMemberRole };

const defaultFilters: KanbanFilters = { assigneeId: "ALL", type: "ALL", priority: "ALL", keyword: "" };

export function KanbanBoard({
  projectId,
  initialItems,
  members,
  canEdit,
}: {
  projectId: string;
  initialItems: WorkItem[];
  members: Member[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [filters, setFilters] = useState<KanbanFilters>(defaultFilters);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const profileById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const titleById = useMemo(() => new Map(items.map((i) => [i.id, i.title])), [items]);

  const completionById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const item of items) {
      const kids = items.filter((i) => i.parent_id === item.id);
      map.set(item.id, kids.length ? `${kids.filter((k) => k.stage === "COMPLETED").length}/${kids.length}` : null);
    }
    return map;
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.assigneeId === "UNASSIGNED" && item.assignee_id) return false;
      if (
        filters.assigneeId !== "ALL" &&
        filters.assigneeId !== "UNASSIGNED" &&
        item.assignee_id !== filters.assigneeId
      )
        return false;
      if (filters.type !== "ALL" && item.type !== filters.type) return false;
      if (filters.priority !== "ALL" && item.priority !== filters.priority) return false;
      if (filters.keyword && !item.title.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      return true;
    });
  }, [items, filters]);

  const columns = useMemo(() => {
    const map = new Map<Stage, WorkItem[]>();
    for (const stage of STAGES) {
      map.set(
        stage,
        visibleItems.filter((i) => i.stage === stage).sort((a, b) => a.position - b.position)
      );
    }
    return map;
  }, [visibleItems]);

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    const overIsColumn = (STAGES as string[]).includes(String(over.id));
    const targetStage: Stage = overIsColumn
      ? (over.id as Stage)
      : (items.find((i) => i.id === over.id)?.stage ?? activeItem.stage);

    const destItems = (columns.get(targetStage) ?? []).filter((i) => i.id !== activeItem.id);
    let insertIndex = destItems.length;
    if (!overIsColumn) {
      const idx = destItems.findIndex((i) => i.id === over.id);
      if (idx !== -1) insertIndex = idx;
    }

    const reordered = [...destItems];
    reordered.splice(insertIndex, 0, { ...activeItem, stage: targetStage });

    const updates = reordered.map((item, index) => ({ id: item.id, position: index, stage: targetStage }));

    const prevItems = items;
    setItems((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.id === item.id);
        return update ? { ...item, stage: update.stage, position: update.position } : item;
      })
    );

    startTransition(async () => {
      try {
        await Promise.all(
          updates.map((u) =>
            updateWorkItem({ id: u.id, projectId, stage: u.stage, position: u.position })
          )
        );
      } catch (e) {
        setItems(prevItems);
        toast.error(e instanceof Error ? e.message : "Failed to move item.");
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <FilterBar members={members} filters={filters} onChange={setFilters} />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto p-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              items={columns.get(stage) ?? []}
              profileById={profileById}
              titleById={titleById}
              completionById={completionById}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
