"use client";

import { useState } from "react";
import { Check, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssigneeAvatar, PriorityBadge, StageBadge } from "@/components/shared/badges";
import { PRIORITIES, STAGES, type Priority, type Profile, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const triggerCls =
  "inline-flex items-center rounded-full outline-none transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none";

const menuItemCls =
  "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent";

export function StagePicker({
  value,
  onChange,
  disabled,
}: {
  value: Stage;
  onChange: (s: Stage) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} className={triggerCls} onClick={(e) => e.stopPropagation()}>
        <StageBadge stage={value} />
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {STAGES.map((s) => (
          <button key={s} className={menuItemCls} onClick={() => { onChange(s); setOpen(false); }}>
            <StageBadge stage={s} />
            {s === value && <Check className="size-3.5 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function PriorityPicker({
  value,
  onChange,
  disabled,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} className={triggerCls} onClick={(e) => e.stopPropagation()}>
        <PriorityBadge priority={value} />
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {PRIORITIES.map((p) => (
          <button key={p} className={menuItemCls} onClick={() => { onChange(p); setOpen(false); }}>
            <PriorityBadge priority={p} />
            {p === value && <Check className="size-3.5 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function AssigneePicker({
  members,
  value,
  onChange,
  disabled,
  showName = false,
}: {
  members: Profile[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  showName?: boolean;
}) {
  const current = members.find((m) => m.id === value) ?? null;
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full outline-none transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none",
          showName && "rounded-lg px-1 py-0.5 hover:bg-accent"
        )}
        title={current ? current.name : "Unassigned"}
      >
        <AssigneeAvatar profile={current} size={showName ? "sm" : "sm"} />
        {showName && (
          <span className={cn("text-sm", !current && "text-muted-foreground")}>{current?.name ?? "Unassigned"}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Assign to</p>
        <button className={menuItemCls} onClick={() => { onChange(null); setOpen(false); }}>
          <span className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
              <UserRound className="size-3 text-muted-foreground" />
            </span>
            Unassigned
          </span>
          {!value && <Check className="size-3.5 text-brand" />}
        </button>
        {members.map((m) => (
          <button key={m.id} className={menuItemCls} onClick={() => { onChange(m.id); setOpen(false); }}>
            <span className="flex min-w-0 items-center gap-2">
              <AssigneeAvatar profile={m} />
              <span className="truncate">{m.name}</span>
            </span>
            {m.id === value && <Check className="size-3.5 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function dueDateState(due: string | null, stage: Stage) {
  if (!due || stage === "COMPLETED") return "none" as const;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = (new Date(due + "T00:00:00Z").getTime() - today) / 86400000;
  if (diff < 0) return "overdue" as const;
  if (diff <= 2) return "soon" as const;
  return "none" as const;
}

export { formatShortDate as formatDue } from "@/lib/format";
