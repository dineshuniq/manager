"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AssigneeAvatar, ProgressBar, STAGE_STYLES, TypeBadge } from "@/components/shared/badges";
import { AssigneePicker, PriorityPicker, StagePicker } from "./property-pickers";
import type { Profile, WorkItem, WorkItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Patch = Partial<Pick<WorkItem, "title" | "description" | "assignee_id" | "stage" | "priority" | "due_date">>;

export interface WorkItemSheetProps {
  itemId: string | null;
  items: WorkItem[];
  members: Profile[];
  canEdit: boolean;
  canManage: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onUpdate: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
  onCreateChild: (parentId: string, type: WorkItemType, title: string) => Promise<WorkItem | null>;
}

const CHILD_TYPE: Record<WorkItemType, WorkItemType | null> = { STORY: "TASK", TASK: "SUBTASK", SUBTASK: null };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3 py-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Body({
  item,
  items,
  members,
  canEdit,
  canManage,
  onOpen,
  onUpdate,
  onDelete,
  onCreateChild,
  onClose,
}: Omit<WorkItemSheetProps, "itemId"> & { item: WorkItem }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [childTitle, setChildTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const byId = new Map(items.map((i) => [i.id, i]));
  const trail: WorkItem[] = [];
  let cursor = item.parent_id ? byId.get(item.parent_id) : undefined;
  while (cursor) {
    trail.unshift(cursor);
    cursor = cursor.parent_id ? byId.get(cursor.parent_id) : undefined;
  }
  const children = items.filter((i) => i.parent_id === item.id).sort((a, b) => a.position - b.position);
  const done = children.filter((c) => c.stage === "COMPLETED").length;
  const childType = CHILD_TYPE[item.type];

  async function addChild() {
    if (!childType || !childTitle.trim()) return;
    setCreating(true);
    const created = await onCreateChild(item.id, childType, childTitle.trim());
    setCreating(false);
    if (created) setChildTitle("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn("h-1 w-full shrink-0", STAGE_STYLES[item.stage].bar)} />
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <TypeBadge type={item.type} />
          {trail.map((p) => (
            <span key={p.id} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0" />
              <button onClick={() => onOpen(p.id)} className="truncate hover:text-foreground hover:underline">
                {p.title}
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
        <SheetTitle className="sr-only">{item.title}</SheetTitle>
        <textarea
          value={title}
          disabled={!canEdit}
          rows={1}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t && t !== item.title) onUpdate(item.id, { title: t });
            else setTitle(item.title);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          maxLength={200}
          className="field-sizing-content w-full resize-none rounded-lg bg-transparent px-1 text-xl font-semibold leading-snug tracking-tight [overflow-wrap:anywhere] sm:text-2xl outline-none transition-colors hover:bg-muted/40 focus:bg-muted/40"
        />

        <div className="rounded-2xl border bg-card/60 px-4 py-2">
          <Row label="Stage">
            <StagePicker value={item.stage} disabled={!canEdit} canComplete={canManage} onChange={(stage) => onUpdate(item.id, { stage })} />
          </Row>
          <Row label="Priority">
            <PriorityPicker value={item.priority} disabled={!canEdit} onChange={(priority) => onUpdate(item.id, { priority })} />
          </Row>
          <Row label="Assignee">
            <AssigneePicker
              members={members}
              value={item.assignee_id}
              showName
              disabled={!canEdit}
              onChange={(assignee_id) => onUpdate(item.id, { assignee_id })}
            />
          </Row>
          <Row label="Due date">
            <label className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm hover:bg-accent">
              <CalendarDays className="size-4 text-muted-foreground" />
              <input
                type="date"
                disabled={!canEdit}
                value={item.due_date ?? ""}
                onChange={(e) => onUpdate(item.id, { due_date: e.target.value || null })}
                className="bg-transparent text-sm outline-none"
              />
            </label>
          </Row>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Description</p>
          <textarea
            value={description}
            disabled={!canEdit}
            placeholder={canEdit ? "Add more detail…" : "No description"}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (item.description ?? "")) onUpdate(item.id, { description: description || null });
            }}
            className="field-sizing-content min-h-24 w-full resize-none rounded-xl border bg-background/50 px-3 py-2.5 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
          />
        </div>

        {childType && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {childType === "TASK" ? "Tasks" : "Subtasks"}
                <span className="ml-1.5 tabular-nums">
                  {done}/{children.length}
                </span>
              </p>
            </div>
            {children.length > 0 && <ProgressBar value={(done / children.length) * 100} className="mb-3" />}
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {children.map((c) => (
                  <motion.button
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpen(c.id)}
                    className="group flex w-full items-start gap-2.5 rounded-lg border bg-card/50 px-3 py-2 text-left transition-all hover:border-brand/30 hover:bg-accent/50"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", STAGE_STYLES[c.stage].dot)} />
                    <span className={cn("flex-1 text-sm leading-5 [overflow-wrap:anywhere]", c.stage === "COMPLETED" && "text-muted-foreground line-through")}>
                      {c.title}
                    </span>
                    <AssigneeAvatar profile={members.find((m) => m.id === c.assignee_id)} size="xs" />
                    <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            {canEdit && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addChild();
                }}
                className="mt-2 flex items-start gap-2 rounded-lg border border-dashed px-3 py-1.5 transition-colors focus-within:border-brand/50 focus-within:bg-brand/5"
              >
                {creating ? (
                  <Loader2 className="mt-1.5 size-4 shrink-0 animate-spin text-brand" />
                ) : (
                  <Plus className="mt-1.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <textarea
                  rows={1}
                  maxLength={200}
                  value={childTitle}
                  disabled={creating}
                  onChange={(e) => setChildTitle(e.target.value.replace(/\s*\n\s*/g, " "))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={`Add a ${childType.toLowerCase()} and press Enter`}
                  className="field-sizing-content min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-5 outline-none [overflow-wrap:anywhere] placeholder:text-muted-foreground/60"
                />
              </form>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground sm:px-8">
        <span>Created {formatDate(item.created_at)}</span>
        {canManage && (
          <button
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              onDelete(item.id);
              onClose();
            }}
            onMouseLeave={() => setConfirmDelete(false)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all",
              confirmDelete ? "bg-destructive text-white" : "text-destructive hover:bg-destructive/10"
            )}
          >
            <Trash2 className="size-3.5" />
            {confirmDelete ? (children.length ? "Delete with children?" : "Click to confirm") : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkItemSheet(props: WorkItemSheetProps) {
  const item = props.itemId ? props.items.find((i) => i.id === props.itemId) : undefined;
  return (
    <Sheet open={!!item} onOpenChange={(v) => !v && props.onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:w-[max(50vw,38rem)] data-[side=right]:sm:max-w-[100vw]"
      >
        {item && <Body key={item.id} {...props} item={item} />}
      </SheetContent>
    </Sheet>
  );
}
