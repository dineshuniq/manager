"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, CornerDownRight, Layers, Plus, Search, Trash2 } from "lucide-react";
import type { Profile, ProjectMemberRole, WorkItem, WorkItemType } from "@/lib/types";
import { useWorkItems } from "@/lib/use-work-items";
import { ProgressRing, TypeBadge } from "@/components/shared/badges";
import { AssigneePicker, PriorityPicker, StagePicker, dueDateState } from "@/components/work-item/property-pickers";
import { WorkItemSheet } from "@/components/work-item/work-item-sheet";
import { Fab } from "@/components/shell/fab";
import { cn } from "@/lib/utils";

type Member = Profile & { member_role: ProjectMemberRole };

const CHILD_TYPE: Record<WorkItemType, WorkItemType | null> = { STORY: "TASK", TASK: "SUBTASK", SUBTASK: null };
const GRID = "xl:grid xl:grid-cols-[minmax(280px,1fr)_130px_110px_140px_130px_72px] xl:items-start xl:gap-3";
const CELL = "flex min-h-7 items-center pointer-coarse:min-h-9";
// Tree indentation per level: tighter on phones.
const INDENT = "pl-[calc(var(--depth)*14px)] xl:pl-[calc(var(--depth)*28px)]";
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
      <div
        className="flex items-start gap-2 border-b bg-brand/5 py-2 pl-[calc(var(--depth)*14px+2.75rem)] pr-4 xl:pl-[calc(var(--depth)*28px+2.75rem)]"
        style={{ "--depth": depth } as React.CSSProperties}
      >
        <span className="flex h-7 shrink-0 items-center">
          <TypeBadge type={type} compact />
        </span>
        <textarea
          autoFocus
          rows={1}
          maxLength={200}
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value.replace(/\s*\n\s*/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          onBlur={() => !value && onCancel()}
          placeholder={`${type === "STORY" ? "Story" : type === "TASK" ? "Task" : "Subtask"} title — Enter to add, Esc to close`}
          className="field-sizing-content min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-5 outline-none [overflow-wrap:anywhere] placeholder:text-muted-foreground/70"
        />
        <span className="hidden h-7 items-center text-[11px] text-muted-foreground sm:flex">↵ Enter</span>
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
            "group relative flex flex-col gap-1.5 border-b px-4 py-3 transition-colors hover:bg-accent/40 xl:py-2",
            item.type === "STORY" && "bg-surface/40"
          )}
        >
          <div className={cn("flex min-w-0 items-start gap-2", INDENT)} style={{ "--depth": depth } as React.CSSProperties}>
            {Array.from({ length: depth }).map((_, d) => (
              <span
                key={d}
                aria-hidden
                className="absolute inset-y-0 left-[calc(1rem+var(--g)*14px+11px)] w-px bg-border xl:left-[calc(1rem+var(--g)*28px+11px)]"
                style={{ "--g": d } as React.CSSProperties}
              />
            ))}
            {childType ? (
              <button
                onClick={() => toggle(item.id)}
                aria-label={isOpen ? "Collapse" : "Expand"}
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:-m-1.5 pointer-coarse:mt-[-4px] pointer-coarse:size-9"
              >
                <ChevronRight className={cn("size-4 transition-transform duration-200", isOpen && kids.length > 0 && "rotate-90")} />
              </button>
            ) : (
              <CornerDownRight className="ml-1 mt-[7px] size-3.5 shrink-0 text-muted-foreground/50" />
            )}
            <span className="flex h-7 shrink-0 items-center">
              <TypeBadge type={item.type} compact />
            </span>
            <button
              onClick={() => setOpenId(item.id)}
              className={cn(
                "min-w-0 flex-1 py-1 text-left text-sm leading-5 transition-colors [overflow-wrap:anywhere] hover:text-brand",
                item.type === "STORY" && "font-semibold",
                item.stage === "COMPLETED" && "text-muted-foreground line-through decoration-stage-done/60"
              )}
            >
              {item.title}
            </button>
            {allKids.length > 0 && (
              <span className="flex h-7 shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground" title={`${done}/${allKids.length} complete`}>
                <ProgressRing done={done} total={allKids.length} size={15} />
                {done}/{allKids.length}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1 pl-[calc(var(--depth)*14px+2rem)] xl:contents",
            )}
            style={{ "--depth": depth } as React.CSSProperties}
          >
          <div className={cn(CELL, "min-w-0")}>
            <AssigneePicker
              members={members}
              value={item.assignee_id}
              showName
              nameClassName="hidden xl:inline"
              disabled={!canEdit}
              onChange={(assignee_id) => update(item.id, { assignee_id })}
            />
          </div>
          <div className={CELL}>
            <PriorityPicker value={item.priority} disabled={!canEdit} onChange={(priority) => update(item.id, { priority })} />
          </div>
          <div className={CELL}>
            <StagePicker value={item.stage} disabled={!canEdit} canComplete={canManage} onChange={(stage) => update(item.id, { stage })} />
          </div>
          <input
            type="date"
            value={item.due_date ?? ""}
            disabled={!canEdit}
            onChange={(e) => update(item.id, { due_date: e.target.value || null })}
            className={cn(
              "h-7 w-[8.5rem] rounded-lg border border-transparent bg-transparent px-1.5 text-xs outline-none transition-colors hover:border-input focus:border-brand/50 pointer-coarse:h-9 xl:w-full",
              !item.due_date && "hidden text-muted-foreground/60 xl:block",
              due === "overdue" && "font-medium text-destructive",
              due === "soon" && "font-medium text-stage-review"
            )}
          />
          <div className="ml-auto flex min-h-7 items-center justify-end gap-0.5 transition-opacity xl:ml-0 pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
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
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand pointer-coarse:size-9 pointer-coarse:border pointer-coarse:bg-surface/60"
              >
                <Plus className="size-4" />
              </button>
            )}
            {canManage && (
              <button
                title="Delete"
                onClick={() => remove(item.id)}
                className="hidden size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive pointer-fine:inline-flex"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
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
    <div className="px-4 pb-28 pt-4 sm:px-6 md:pb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="group relative min-w-0 flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title"
            className="h-10 w-full rounded-xl border border-input bg-surface/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 sm:h-9 sm:w-56 sm:focus:w-64 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
        <div className="flex h-10 items-center rounded-xl border bg-surface/60 p-1 sm:h-9">
          <button
            onClick={() => setCollapsed(new Set())}
            aria-label="Expand all"
            title="Expand all"
            className="inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronsUpDown className="size-4 sm:size-3.5" /> <span className="hidden sm:inline">Expand all</span>
          </button>
          <button
            onClick={() => setCollapsed(new Set(parentIds))}
            aria-label="Collapse all"
            title="Collapse all"
            className="inline-flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronsDownUp className="size-4 sm:size-3.5" /> <span className="hidden sm:inline">Collapse all</span>
          </button>
        </div>
        <span className="w-full text-xs tabular-nums text-muted-foreground sm:ml-auto sm:w-auto">{items.length} items</span>
        {canManage && (
          <button
            onClick={() => setAdding(ROOT)}
            className="group hidden h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.97] md:inline-flex"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" /> New story
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card/60 shadow-sm backdrop-blur xl:overflow-x-auto">
        <div className="xl:min-w-[900px]">
          <div className={cn(GRID, "hidden border-b bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground xl:grid")}>
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

      {canManage && !openId && adding !== ROOT && <Fab label="New story" onClick={() => setAdding(ROOT)} />}
    </div>
  );
}
