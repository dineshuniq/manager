"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssigneeAvatar, PriorityBadge } from "@/components/shared/badges";
import { PRIORITIES, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface KanbanFilters {
  assigneeId: string;
  type: string;
  priority: string;
  keyword: string;
}

export const defaultFilters: KanbanFilters = { assigneeId: "ALL", type: "ALL", priority: "ALL", keyword: "" };

const TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "STORY", label: "Stories" },
  { value: "TASK", label: "Tasks" },
  { value: "SUBTASK", label: "Subtasks" },
];

function Controls({
  members,
  filters,
  onChange,
  scope,
}: {
  members: Profile[];
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
  scope: "inline" | "sheet";
}) {
  return (
    <>
      <div className="flex h-10 w-full items-center rounded-xl border bg-surface/60 p-1 md:h-9 md:w-auto">
        {TYPE_OPTIONS.map((o) => {
          const on = filters.type === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange({ ...filters, type: o.value })}
              className={cn(
                "relative h-full flex-1 rounded-lg px-2.5 text-xs font-medium transition-colors md:flex-none",
                on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {on && (
                <motion.span
                  layoutId={`type-filter-pill-${scope}`}
                  className="absolute inset-0 rounded-lg bg-accent shadow-sm ring-1 ring-brand/15"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="no-scrollbar flex max-w-full items-center -space-x-1.5 overflow-x-auto rounded-xl border bg-surface/60 px-2 py-1.5 md:py-1 pointer-coarse:space-x-0 pointer-coarse:gap-1">
        {members.map((m) => {
          const on = filters.assigneeId === m.id;
          return (
            <button
              key={m.id}
              title={`Filter: ${m.name}`}
              aria-pressed={on}
              onClick={() => onChange({ ...filters, assigneeId: on ? "ALL" : m.id })}
              className={cn(
                "shrink-0 rounded-full transition-all hover:z-10 hover:-translate-y-0.5",
                on ? "z-10 scale-110 ring-2 ring-brand ring-offset-2 ring-offset-background" : filters.assigneeId !== "ALL" && "opacity-40"
              )}
            >
              <AssigneeAvatar profile={m} size="sm" className="pointer-coarse:size-8 pointer-coarse:text-xs" />
            </button>
          );
        })}
        <button
          title="Filter: Unassigned"
          aria-pressed={filters.assigneeId === "UNASSIGNED"}
          onClick={() => onChange({ ...filters, assigneeId: filters.assigneeId === "UNASSIGNED" ? "ALL" : "UNASSIGNED" })}
          className={cn(
            "shrink-0 rounded-full bg-background transition-all hover:z-10 hover:-translate-y-0.5",
            filters.assigneeId === "UNASSIGNED"
              ? "z-10 scale-110 ring-2 ring-brand ring-offset-2 ring-offset-background"
              : filters.assigneeId !== "ALL" && "opacity-40"
          )}
        >
          <AssigneeAvatar profile={null} size="sm" className="pointer-coarse:size-8" />
        </button>
      </div>

      <Select value={filters.priority} onValueChange={(v) => v && onChange({ ...filters, priority: v })}>
        <SelectTrigger className="h-10 w-full rounded-xl bg-surface/60 sm:w-36 md:h-9">
          <SelectValue>
            {(v: string) => (v === "ALL" ? "Any priority" : <PriorityBadge priority={v as (typeof PRIORITIES)[number]} />)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any priority</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              <PriorityBadge priority={p} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function FilterBar({
  members,
  filters,
  onChange,
  shown,
  total,
  children,
}: {
  members: Profile[];
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
  shown: number;
  total: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    (filters.assigneeId !== "ALL" ? 1 : 0) + (filters.type !== "ALL" ? 1 : 0) + (filters.priority !== "ALL" ? 1 : 0);
  const active = activeCount > 0 || filters.keyword !== "";

  return (
    <div className="px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="group relative min-w-0 flex-1 md:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
          <input
            type="search"
            placeholder="Search work items"
            value={filters.keyword}
            onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
            className="h-10 w-full rounded-xl border border-input bg-surface/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 md:h-9 md:w-52 md:focus:w-64 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        {/* Mobile: collapse the secondary filters behind a toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors md:hidden",
            open || activeCount ? "border-brand/40 bg-brand/10 text-brand" : "bg-surface/60 text-muted-foreground"
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-2.5 md:flex">
          <Controls members={members} filters={filters} onChange={onChange} scope="inline" />
        </div>

        {active && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onChange(defaultFilters)}
            aria-label="Clear filters"
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-9"
          >
            <X className="size-3.5" /> <span className="hidden sm:inline">Clear</span>
          </motion.button>
        )}

        <div className="hidden items-center gap-3 md:ml-auto md:flex">
          <span className="text-xs tabular-nums text-muted-foreground">{active ? `${shown} of ${total}` : `${total} items`}</span>
          {children}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-2.5 pt-2.5">
              <Controls members={members} filters={filters} onChange={onChange} scope="sheet" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-2 text-xs tabular-nums text-muted-foreground md:hidden">
        {active ? `Showing ${shown} of ${total} items` : `${total} items`}
      </p>
    </div>
  );
}
