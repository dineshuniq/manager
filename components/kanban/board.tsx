"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { STAGES, STAGE_LABELS, type Profile, type ProjectMemberRole, type Stage, type WorkItem } from "@/lib/types";
import { useWorkItems } from "@/lib/use-work-items";
import { WorkItemSheet } from "@/components/work-item/work-item-sheet";
import { KanbanColumn } from "./column";
import { CardFace, type CardMeta } from "./card";
import { FilterBar, defaultFilters, type KanbanFilters } from "./filter-bar";

type Member = Profile & { member_role: ProjectMemberRole };

const isStage = (id: unknown): id is Stage => (STAGES as string[]).includes(String(id));

export function KanbanBoard({
  projectId,
  initialItems,
  members,
  canEdit,
  canManage,
}: {
  projectId: string;
  initialItems: WorkItem[];
  members: Member[];
  canEdit: boolean;
  canManage: boolean;
}) {
  const { items, setItems, itemsRef, update, remove, create, persistOrder } = useWorkItems(projectId, initialItems);
  const [filters, setFilters] = useState<KanbanFilters>(defaultFilters);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(0);
  const [creating, setCreating] = useState(false);
  const snapshot = useRef<WorkItem[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const metaById = useMemo(() => {
    const profileById = new Map(members.map((m) => [m.id, m]));
    const byId = new Map(items.map((i) => [i.id, i]));
    const kids = new Map<string, { done: number; total: number }>();
    for (const i of items) {
      if (!i.parent_id) continue;
      const k = kids.get(i.parent_id) ?? { done: 0, total: 0 };
      k.total++;
      if (i.stage === "COMPLETED") k.done++;
      kids.set(i.parent_id, k);
    }
    const map = new Map<string, CardMeta>();
    for (const i of items) {
      const k = kids.get(i.id);
      map.set(i.id, {
        assignee: i.assignee_id ? (profileById.get(i.assignee_id) ?? null) : null,
        parentTitle: i.parent_id ? (byId.get(i.parent_id)?.title ?? null) : null,
        childDone: k?.done ?? 0,
        childTotal: k?.total ?? 0,
      });
    }
    return map;
  }, [items, members]);

  const visibleItems = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.assigneeId === "UNASSIGNED" && item.assignee_id) return false;
      if (filters.assigneeId !== "ALL" && filters.assigneeId !== "UNASSIGNED" && item.assignee_id !== filters.assigneeId)
        return false;
      if (filters.type !== "ALL" && item.type !== filters.type) return false;
      if (filters.priority !== "ALL" && item.priority !== filters.priority) return false;
      if (kw && !item.title.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [items, filters]);

  const columns = useMemo(() => {
    const map = new Map<Stage, WorkItem[]>(STAGES.map((s) => [s, []]));
    for (const i of visibleItems) map.get(i.stage)!.push(i);
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [visibleItems]);

  const stageOf = useCallback(
    (id: string | number) => (isStage(id) ? id : itemsRef.current.find((i) => i.id === id)?.stage),
    [itemsRef]
  );

  function handleDragStart(e: DragStartEvent) {
    snapshot.current = itemsRef.current;
    setActiveId(String(e.active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = stageOf(active.id);
    const to = stageOf(over.id);
    if (!from || !to || from === to) return;

    setItems((prev) => {
      const overItem = prev.find((i) => i.id === over.id);
      const maxPos = Math.max(-1, ...prev.filter((i) => i.stage === to).map((i) => i.position));
      const position = overItem ? overItem.position - 0.5 : maxPos + 1;
      return prev.map((i) => (i.id === active.id ? { ...i, stage: to, position } : i));
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const before = snapshot.current;
    snapshot.current = null;
    if (!before) return;
    if (!over) {
      setItems(before);
      return;
    }

    const current = itemsRef.current;
    const activeItem = current.find((i) => i.id === active.id);
    if (!activeItem) return;
    const stage = activeItem.stage;

    const column = current.filter((i) => i.stage === stage).sort((a, b) => a.position - b.position);
    const oldIndex = column.findIndex((i) => i.id === active.id);
    const newIndex = isStage(over.id) ? column.length - 1 : column.findIndex((i) => i.id === over.id);
    const ordered = newIndex >= 0 && oldIndex !== newIndex ? arrayMove(column, oldIndex, newIndex) : column;
    const positions = new Map(ordered.map((i, idx) => [i.id, idx]));

    const next = current.map((i) => (positions.has(i.id) ? { ...i, position: positions.get(i.id)! } : i));
    setItems(next);
    persistOrder(before, next);

    const prevStage = before.find((i) => i.id === active.id)?.stage;
    if (prevStage && prevStage !== stage) {
      if (stage === "COMPLETED") setCelebrate((c) => c + 1);
      toast.success(`Moved to ${STAGE_LABELS[stage]}`, { description: activeItem.title, duration: 2000 });
    }
  }

  function handleDragCancel() {
    if (snapshot.current) setItems(snapshot.current);
    snapshot.current = null;
    setActiveId(null);
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  async function newStory() {
    setCreating(true);
    const created = await create(null, "STORY", "Untitled story");
    setCreating(false);
    if (created) setOpenId(created.id);
  }

  return (
    <div className="flex h-full flex-col">
      <FilterBar members={members} filters={filters} onChange={setFilters} shown={visibleItems.length} total={items.length}>
        {canManage && (
          <button
            onClick={newStory}
            disabled={creating}
            className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-70"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            )}
            New story
          </button>
        )}
      </FilterBar>

      <DndContext
        id={`board-${projectId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto px-4 pb-8 pt-1 sm:px-6">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              items={columns.get(stage)!}
              metaById={metaById}
              canEdit={canEdit}
              celebrate={stage === "COMPLETED" ? celebrate : 0}
              onOpen={setOpenId}
            />
          ))}
        </div>
        <DragOverlay
          dropAnimation={{
            duration: 260,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
          }}
        >
          {activeItem ? <CardFace item={activeItem} meta={metaById.get(activeItem.id)!} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <WorkItemSheet
        itemId={openId}
        items={items}
        members={members}
        canEdit={canEdit}
        canManage={canManage}
        onClose={() => setOpenId(null)}
        onOpen={setOpenId}
        onUpdate={update}
        onDelete={remove}
        onCreateChild={create}
      />
    </div>
  );
}
