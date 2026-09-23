"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createWorkItem,
  deleteWorkItem,
  reorderWorkItems,
  updateWorkItem,
} from "@/app/(dashboard)/projects/[projectId]/actions";
import type { Stage, WorkItem, WorkItemType } from "@/lib/types";

type Patch = Partial<Pick<WorkItem, "title" | "description" | "assignee_id" | "stage" | "priority" | "due_date">>;

function toActionPatch(patch: Patch) {
  return {
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.assignee_id !== undefined && { assigneeId: patch.assignee_id }),
    ...(patch.stage !== undefined && { stage: patch.stage }),
    ...(patch.priority !== undefined && { priority: patch.priority }),
    ...(patch.due_date !== undefined && { dueDate: patch.due_date }),
  };
}

export function descendantIds(items: WorkItem[], id: string) {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const i of items) {
      if (i.parent_id && ids.has(i.parent_id) && !ids.has(i.id)) {
        ids.add(i.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function useWorkItems(projectId: string, initial: WorkItem[]) {
  const [items, setItemsState] = useState(initial);
  const itemsRef = useRef(items);
  const [, startTransition] = useTransition();

  // Always called from event handlers, so reading the ref here is safe and keeps
  // rollback snapshots consistent across rapid successive edits.
  const setItems = useCallback((next: WorkItem[] | ((prev: WorkItem[]) => WorkItem[])) => {
    const value = typeof next === "function" ? next(itemsRef.current) : next;
    itemsRef.current = value;
    setItemsState(value);
  }, []);

  const update = useCallback(
    (id: string, patch: Patch) => {
      const before = itemsRef.current.find((i) => i.id === id);
      if (!before) return;
      const restore = Object.fromEntries(Object.keys(patch).map((k) => [k, before[k as keyof WorkItem]])) as Patch;

      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      startTransition(async () => {
        try {
          await updateWorkItem({ id, projectId, ...toActionPatch(patch) });
        } catch (e) {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...restore } : i)));
          toast.error(e instanceof Error ? e.message : "Couldn't save that change — reverted.");
        }
      });
    },
    [projectId, setItems]
  );

  const remove = useCallback(
    (id: string) => {
      const ids = descendantIds(itemsRef.current, id);
      const removed = itemsRef.current.filter((i) => ids.has(i.id));
      setItems((prev) => prev.filter((i) => !ids.has(i.id)));
      startTransition(async () => {
        try {
          await deleteWorkItem(id, projectId);
          toast.success(removed.length > 1 ? `Deleted ${removed.length} items` : "Item deleted");
        } catch (e) {
          setItems((prev) => [...prev, ...removed]);
          toast.error(e instanceof Error ? e.message : "Couldn't delete — restored.");
        }
      });
    },
    [projectId, setItems]
  );

  const create = useCallback(
    async (parentId: string | null, type: WorkItemType, title: string) => {
      try {
        const created = (await createWorkItem({ projectId, parentId, type, title, priority: "MEDIUM" })) as WorkItem;
        setItems((prev) => [...prev, created]);
        return created;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't create item.");
        return null;
      }
    },
    [projectId, setItems]
  );

  const persistOrder = useCallback(
    (snapshot: WorkItem[], next: WorkItem[]) => {
      const prevById = new Map(snapshot.map((i) => [i.id, i]));
      const updates = next
        .filter((i) => {
          const p = prevById.get(i.id);
          return p && (p.stage !== i.stage || p.position !== i.position);
        })
        .map((i) => ({ id: i.id, stage: i.stage as Stage, position: i.position }));
      if (updates.length === 0) return;

      startTransition(async () => {
        try {
          await reorderWorkItems({ projectId, updates });
        } catch (e) {
          setItems(snapshot);
          toast.error(e instanceof Error ? e.message : "Couldn't move item — reverted.");
        }
      });
    },
    [projectId, setItems]
  );

  return { items, setItems, itemsRef, update, remove, create, persistOrder };
}
