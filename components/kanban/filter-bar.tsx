"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority, Profile, WorkItemType } from "@/lib/types";
import { PRIORITIES, WORK_ITEM_TYPES } from "@/lib/types";
import { Search } from "lucide-react";

export interface KanbanFilters {
  assigneeId: string;
  type: string;
  priority: string;
  keyword: string;
}

export function FilterBar({
  members,
  filters,
  onChange,
}: {
  members: Profile[];
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          className="h-8 w-48 pl-8"
        />
      </div>

      <Select
        value={filters.assigneeId}
        onValueChange={(v) => v && onChange({ ...filters, assigneeId: v })}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All assignees</SelectItem>
          <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => v && onChange({ ...filters, type: v })}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {WORK_ITEM_TYPES.map((t: WorkItemType) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => v && onChange({ ...filters, priority: v })}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All priorities</SelectItem>
          {PRIORITIES.map((p: Priority) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
