"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, CornerDownRight, Layers, Plus, Search, Trash2 } from "lucide-react";
import type { Profile, ProjectMemberRole, WorkItem, WorkItemType } from "@/lib/types";
import { useWorkItems } from "@/lib/use-work-items";
import { ProgressRing, TypeBadge } from "@/components/shared/badges";
import { AssigneePicker, PriorityPicker, StagePicker, dueDateState } from "@/components/work-item/property-pickers";
import { WorkItemSheet } from "@/components/work-item/work-item-sheet";
import { cn } from "@/lib/utils";

type Member = Profile & { member_role: ProjectMemberRole };

const CHILD_TYPE: Record<WorkItemType, WorkItemType | null> = { STORY: "TASK", TASK: "SUBTASK", SUBTASK: null };
const GRID = "grid grid-cols-[minmax(260px,1fr)_120px_110px_140px_130px_72px] items-center gap-3";
const ROOT = "__root__";

function QuickAdd({
  depth,
  type,
  onSubmit,
  onCancel,
}: {
  depth: number;
  type: WorkItemType;
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim() || busy) return;
        setBusy(true);
        await onSubmit(value.trim());
        setBusy(false);
        setValue("");
      }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b bg-brand/5 py-2 pr-4" style={{ paddingLeft: depth * 28 + 44 }}>
        <TypeBadge type={type} compact />
        <input
          autoFocus
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onCancel()}
          onBlur={() => !value && onCancel()}
          placeholder={`${type === "STORY" ? "Story" : type === "TASK" ? "Task" : "Subtask"} title — Enter to add, Esc to close`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <span className="hidden text-[11px] text-muted-foreground sm:inline">↵ Enter</span>
      </div>
    </motion.form>
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
  const { items, update, remove, create } = useWorkItems(projectId, initialItems);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, WorkItem[]>();
    for (const i of items) {
      const list = map.get(i.parent_id) ?? [];
      list.push(i);
      map.set(i.parent_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    return map;
  }, [items]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const keep = new Set<string>();
    const byId = new Map(items.map((i) => [i.id, i]));
    for (const i of items) {
      if (!i.title.toLowerCase().includes(q)) continue;
      let cur: WorkItem | undefined = i;
      while (cur) {
        keep.add(cur.id);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    }
    return keep;
  }, [items, query]);

  const stories = (childrenMap.get(null) ?? []).filter((s) => !matches || matches.has(s.id));

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addChild(parentId: string | null, type: WorkItemType, title: string) {
    await create(parentId, type, title);
    if (parentId) setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  }

  function renderNode(item: WorkItem, depth: number): React.ReactNode {
    const kids = (childrenMap.get(item.id) ?? []).filter((k) => !matches || matches.has(k.id));
    const allKids = childrenMap.get(item.id) ?? [];
    const done = allKids.filter((k) => k.stage === "COMPLETED").length;
    const isOpen = !collapsed.has(item.id) || !!matches;
    const childType = CHILD_TYPE[item.type];
    const due = dueDateState(item.due_date, item.stage);

    return (
      <div key={item.id}>
        <div
          className={cn(
            GRID,
            "group relative border-b px-4 py-2 transition-colors hover:bg-accent/40",
            item.type === "STORY" && "bg-surface/40"
          )}
        >
          <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: depth * 28 }}>
            {Array.from({ length: depth }).map((_, d) => (
              <span
                key={d}
                aria-hidden
                className="absolute inset-y-0 w-px bg-border"
                style={{ left: 16 + d * 28 + 11 }}
              />
            ))}
            {childType ? (
              <button
                onClick={() => toggle(item.id)}
                aria-label={isOpen ? "Collapse" : "Expand"}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className={cn("size-4 transition-transform duration-200", isOpen && kids.length > 0 && "rotate-90")} />
              </button>
            ) : (
              <CornerDownRight className="ml-1 size-3.5 shrink-0 text-muted-foreground/50" />
            )}
            <TypeBadge type={item.type} compact />
            <button
              onClick={() => setOpenId(item.id)}
              className={cn(
                "min-w-0 truncate text-left text-sm transition-colors hover:text-brand",
                item.type === "STORY" && "font-semibold",
                item.stage === "COMPLETED" && "text-muted-foreground line-through decoration-stage-done/60"
              )}
            >
              {item.title}
            </button>
            {allKids.length > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground" title={`${done}/${allKids.length} complete`}>
                <ProgressRing done={done} total={allKids.length} size={15} />
                {done}/{allKids.length}
              </span>
            )}
          </div>

          <AssigneePicker
            members={members}
            value={item.assignee_id}
            showName
            disabled={!canEdit}
            onChange={(assignee_id) => update(item.id, { assignee_id })}
          />
          <PriorityPicker value={item.priority} disabled={!canEdit} onChange={(priority) => update(item.id, { priority })} />
          <StagePicker value={item.stage} disabled={!canEdit} onChange={(stage) => update(item.id, { stage })} />
          <input
            type="date"
            value={item.due_date ?? ""}
            disabled={!canEdit}
            onChange={(e) => update(item.id, { due_date: e.target.value || null })}
            className={cn(
              "h-7 w-full rounded-lg border border-transparent bg-transparent px-1.5 text-xs outline-none transition-colors hover:border-input focus:border-brand/50",
              !item.due_date && "text-muted-foreground/60",
              due === "overdue" && "font-medium text-destructive",
              due === "soon" && "font-medium text-stage-review"
            )}
          />
          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {canEdit && childType && (
              <button
                title={`Add ${childType.toLowerCase()}`}
                onClick={() => {
                  setAdding(item.id);
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                  });
                }}
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand"
              >
                <Plus className="size-4" />
              </button>
            )}
            {canManage && (
              <button
                title="Delete"
                onClick={() => remove(item.id)}
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (kids.length > 0 || adding === item.id) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {kids.map((k) => renderNode(k, depth + 1))}
              <AnimatePresence>
                {adding === item.id && childType && (
                  <QuickAdd
                    key="add"
                    depth={depth + 1}
                    type={childType}
                    onSubmit={(title) => addChild(item.id, childType, title)}
                    onCancel={() => setAdding(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const parentIds = items.filter((i) => i.type !== "SUBTASK").map((i) => i.id);

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title"
            className="h-9 w-56 rounded-xl border border-input bg-surface/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:w-64 focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
          />
        </div>
        <div className="flex h-9 items-center rounded-xl border bg-surface/60 p-1">
          <button
            onClick={() => setCollapsed(new Set())}
            className="inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronsUpDown className="size-3.5" /> Expand all
          </button>
          <button
            onClick={() => setCollapsed(new Set(parentIds))}
            className="inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronsDownUp className="size-3.5" /> Collapse all
          </button>
        </div>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{items.length} items</span>
        {canManage && (
          <button
            onClick={() => setAdding(ROOT)}
            className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" /> New story
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card/60 shadow-sm backdrop-blur">
        <div className="min-w-[900px]">
          <div className={cn(GRID, "sticky top-0 border-b bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground")}>
            <span className="pl-8">Work item</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Stage</span>
            <span>Due</span>
            <span />
          </div>

          {stories.map((s) => renderNode(s, 0))}

          <AnimatePresence>
            {adding === ROOT && (
              <QuickAdd
                key="root-add"
                depth={0}
                type="STORY"
                onSubmit={(title) => addChild(null, "STORY", title)}
                onCancel={() => setAdding(null)}
              />
            )}
          </AnimatePresence>

          {stories.length === 0 && adding !== ROOT && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Layers className="size-5" />
              </span>
              <p className="text-sm font-medium">{matches ? "No matches" : "No stories yet"}</p>
              <p className="text-xs text-muted-foreground">
                {matches ? "Try a different search." : canManage ? "Start with a story, then break it into tasks." : "A manager will add stories soon."}
              </p>
              {canManage && !matches && (
                <button
                  onClick={() => setAdding(ROOT)}
                  className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors hover:border-brand/40 hover:bg-brand/5"
                >
                  <Plus className="size-3.5" /> Add first story
                </button>
              )}
            </div>
          )}

          {canManage && stories.length > 0 && adding !== ROOT && (
            <button
              onClick={() => setAdding(ROOT)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              <Plus className="ml-8 size-4" /> Add story
            </button>
          )}
        </div>
      </div>

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
