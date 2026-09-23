"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "motion/react";
import { Inbox } from "lucide-react";
import { KanbanCard, type CardMeta } from "./card";
import { STAGE_STYLES } from "@/components/shared/badges";
import { STAGE_LABELS, type Stage, type WorkItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return { x: Math.cos(angle) * (38 + (i % 3) * 14), y: Math.sin(angle) * (30 + (i % 4) * 10), i };
});

const PARTICLE_COLORS = ["bg-brand", "bg-brand-2", "bg-brand-3", "bg-stage-done", "bg-stage-review"];

function Burst({ id }: { id: number }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2" key={id}>
      {PARTICLES.map((p) => (
        <motion.span
          key={p.i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn("absolute size-1.5 rounded-full", PARTICLE_COLORS[p.i % PARTICLE_COLORS.length])}
        />
      ))}
    </span>
  );
}

export function KanbanColumn({
  stage,
  items,
  metaById,
  canEdit,
  celebrate,
  onOpen,
}: {
  stage: Stage;
  items: WorkItem[];
  metaById: Map<string, CardMeta>;
  canEdit: boolean;
  celebrate: number;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const s = STAGE_STYLES[stage];

  return (
    <div
      className={cn(
        "flex w-[19rem] shrink-0 flex-col rounded-2xl border bg-muted/30 backdrop-blur-sm transition-all duration-300",
        isOver && cn("bg-muted/60 ring-2", s.ring)
      )}
    >
      <div className={cn("h-1 rounded-t-2xl opacity-80", s.bar)} />
      <div className="relative flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("relative size-2 rounded-full", s.dot)}>
            {stage === "IN_PROGRESS" && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", s.dot)} />}
          </span>
          <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
          <AnimatePresence>{celebrate > 0 && <Burst key={celebrate} id={celebrate} />}</AnimatePresence>
        </div>
        <motion.span
          key={items.length}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset", s.pill)}
        >
          {items.length}
        </motion.span>
      </div>

      <div ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2.5 px-2.5 pb-3">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <KanbanCard
              key={item.id}
              item={item}
              index={index}
              meta={metaById.get(item.id)!}
              disabled={!canEdit}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-8 text-xs text-muted-foreground transition-colors",
              isOver ? "border-current bg-background/40" : "border-border"
            )}
          >
            <Inbox className="size-5 opacity-60" />
            {isOver ? "Release to drop" : "Nothing here yet"}
          </div>
        )}
      </div>
    </div>
  );
}
