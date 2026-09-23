"use client";

import { motion } from "motion/react";
import { Search, X } from "lucide-react";
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
  const active =
    filters.assigneeId !== "ALL" || filters.type !== "ALL" || filters.priority !== "ALL" || filters.keyword !== "";

  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6">
      <div className="group relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
        <input
          placeholder="Search work items"
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          className="h-9 w-52 rounded-xl border border-input bg-surface/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:w-64 focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex h-9 items-center rounded-xl border bg-surface/60 p-1">
        {TYPE_OPTIONS.map((o) => {
          const on = filters.type === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange({ ...filters, type: o.value })}
              className={cn(
                "relative h-full rounded-lg px-2.5 text-xs font-medium transition-colors",
                on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {on && (
                <motion.span
                  layoutId="type-filter-pill"
                  className="absolute inset-0 rounded-lg bg-accent shadow-sm ring-1 ring-brand/15"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center -space-x-1.5 rounded-xl border bg-surface/60 px-2 py-1">
        {members.map((m) => {
          const on = filters.assigneeId === m.id;
          return (
            <button
              key={m.id}
              title={`Filter: ${m.name}`}
              onClick={() => onChange({ ...filters, assigneeId: on ? "ALL" : m.id })}
              className={cn(
                "rounded-full transition-all hover:z-10 hover:-translate-y-0.5",
                on ? "z-10 scale-110 ring-2 ring-brand ring-offset-2 ring-offset-background" : filters.assigneeId !== "ALL" && "opacity-40"
              )}
            >
              <AssigneeAvatar profile={m} size="sm" />
            </button>
          );
        })}
        <button
          title="Filter: Unassigned"
          onClick={() => onChange({ ...filters, assigneeId: filters.assigneeId === "UNASSIGNED" ? "ALL" : "UNASSIGNED" })}
          className={cn(
            "rounded-full bg-background transition-all hover:z-10 hover:-translate-y-0.5",
            filters.assigneeId === "UNASSIGNED"
              ? "z-10 scale-110 ring-2 ring-brand ring-offset-2 ring-offset-background"
              : filters.assigneeId !== "ALL" && "opacity-40"
          )}
        >
          <AssigneeAvatar profile={null} size="sm" />
        </button>
      </div>

      <Select value={filters.priority} onValueChange={(v) => v && onChange({ ...filters, priority: v })}>
        <SelectTrigger className="h-9 w-36 rounded-xl bg-surface/60">
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

      {active && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => onChange(defaultFilters)}
          className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" /> Clear
        </motion.button>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs tabular-nums text-muted-foreground">
          {active ? `${shown} of ${total}` : `${total} items`}
        </span>
        {children}
      </div>
    </div>
  );
}
