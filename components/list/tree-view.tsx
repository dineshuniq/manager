"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { createWorkItem, deleteWorkItem, updateWorkItem } from "@/app/(dashboard)/projects/[projectId]/actions";
import type { Priority, Profile, ProjectMemberRole, Stage, WorkItem, WorkItemType } from "@/lib/types";
import { PRIORITIES, STAGES, STAGE_LABELS } from "@/lib/types";
import { AssigneeAvatar, PriorityBadge, TypeBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Member = Profile & { member_role: ProjectMemberRole };

function childrenOf(items: WorkItem[], parentId: string | null) {
  return items.filter((i) => i.parent_id === parentId).sort((a, b) => a.position - b.position);
}

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="truncate rounded px-1 text-left text-sm hover:bg-muted"
      >
        {value}
      </button>
    );
  }

  return (
    <Input
      autoFocus
      value={draft}
      className="h-7 text-sm"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft.trim() && draft !== value) onSave(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );
}

function AssigneePicker({
  members,
  assigneeId,
  onPick,
}: {
  members: Member[];
  assigneeId: string | null;
  onPick: (id: string | null) => void;
}) {
  const current = members.find((m) => m.id === assigneeId) ?? null;
  return (
    <Popover>
      <PopoverTrigger className="rounded hover:opacity-80">
        <AssigneeAvatar profile={current} />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <button
          onClick={() => onPick(null)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
        >
          Unassigned
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <AssigneeAvatar profile={m} /> {m.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function TreeView({
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
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialItems.map((i) => i.id)));

  const stories = useMemo(() => childrenOf(items, null), [items]);

  function patchLocal(id: string, patch: Partial<WorkItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeLocal(id: string) {
    const toRemove = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of items) {
        if (item.parent_id && toRemove.has(item.parent_id) && !toRemove.has(item.id)) {
          toRemove.add(item.id);
          changed = true;
        }
      }
    }
    setItems((prev) => prev.filter((i) => !toRemove.has(i.id)));
  }

  function handleUpdate(id: string, patch: Partial<WorkItem>, actionPatch: Record<string, unknown>) {
    const prevItems = items;
    patchLocal(id, patch);
    startTransition(async () => {
      try {
        await updateWorkItem({ id, projectId, ...actionPatch });
      } catch (e) {
        setItems(prevItems);
        toast.error(e instanceof Error ? e.message : "Failed to update.");
      }
    });
  }

  function handleDelete(id: string) {
    const prevItems = items;
    removeLocal(id);
    startTransition(async () => {
      try {
        await deleteWorkItem(id, projectId);
      } catch (e) {
        setItems(prevItems);
        toast.error(e instanceof Error ? e.message : "Failed to delete.");
      }
    });
  }

  function handleAdd(parentId: string | null, type: WorkItemType) {
    startTransition(async () => {
      try {
        const created = await createWorkItem({
          projectId,
          parentId,
          type,
          title: type === "STORY" ? "New story" : type === "TASK" ? "New task" : "New subtask",
          priority: "MEDIUM",
        });
        setItems((prev) => [...prev, created as WorkItem]);
        if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create item.");
      }
    });
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function completionRatio(id: string) {
    const kids = childrenOf(items, id);
    if (kids.length === 0) return null;
    const done = kids.filter((k) => k.stage === "COMPLETED").length;
    return `${done}/${kids.length}`;
  }

  function renderNode(item: WorkItem, depth: number): React.ReactNode {
    const kids = childrenOf(items, item.id);
    const isExpanded = expanded.has(item.id);
    const ratio = completionRatio(item.id);

    return (
      <div key={item.id}>
        <div
          className="group flex items-center gap-2 border-b px-2 py-1.5 hover:bg-muted/50"
          style={{ paddingLeft: depth * 24 + 8 }}
        >
          {kids.length > 0 || item.type !== "SUBTASK" ? (
            <button onClick={() => toggle(item.id)} className="text-muted-foreground">
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ) : (
            <span className="inline-block size-4" />
          )}

          <TypeBadge type={item.type} />

          <div className="min-w-0 flex-1">
            {canEdit ? (
              <EditableTitle
                value={item.title}
                onSave={(v) => handleUpdate(item.id, { title: v }, { title: v })}
              />
            ) : (
              <span className="truncate text-sm">{item.title}</span>
            )}
          </div>

          {ratio && <span className="text-xs text-muted-foreground">{ratio} complete</span>}

          <Select
            value={item.priority}
            onValueChange={(v) => {
              if (!v) return;
              handleUpdate(item.id, { priority: v as Priority }, { priority: v });
            }}
            disabled={!canEdit}
          >
            <SelectTrigger size="sm" className="h-7 w-28 border-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <PriorityBadge priority={p} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={item.stage}
            onValueChange={(v) => {
              if (!v) return;
              handleUpdate(item.id, { stage: v as Stage }, { stage: v });
            }}
            disabled={!canEdit}
          >
            <SelectTrigger size="sm" className="h-7 w-32 border-none shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={item.due_date ?? ""}
            disabled={!canEdit}
            onChange={(e) =>
              handleUpdate(item.id, { due_date: e.target.value || null }, { dueDate: e.target.value || null })
            }
            className="h-7 w-36 text-xs"
          />

          {canEdit ? (
            <AssigneePicker
              members={members}
              assigneeId={item.assignee_id}
              onPick={(id) => handleUpdate(item.id, { assignee_id: id }, { assigneeId: id })}
            />
          ) : (
            <AssigneeAvatar profile={members.find((m) => m.id === item.assignee_id)} />
          )}

          {canEdit && item.type !== "SUBTASK" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100"
              title={item.type === "STORY" ? "Add task" : "Add subtask"}
              onClick={() => handleAdd(item.id, item.type === "STORY" ? "TASK" : "SUBTASK")}
            >
              <Plus className="size-4" />
            </Button>
          )}

          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 text-destructive group-hover:opacity-100"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        {isExpanded && kids.map((kid) => renderNode(kid, depth + 1))}
      </div>
    );
  }

  return (
    <div className={cn("min-w-[900px]")}>
      {canManage && (
        <div className="flex justify-end border-b px-2 py-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => handleAdd(null, "STORY")}>
            <Plus className="size-4" /> Add story
          </Button>
        </div>
      )}
      {stories.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">No stories yet.</p>
      )}
      {stories.map((s) => renderNode(s, 0))}
    </div>
  );
}
