"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye } from "lucide-react";
import { ProjectTabs } from "./project-tabs";
import { cn } from "@/lib/utils";

// Pinned tab bar. Once the full header (#project-header-info) scrolls out of view,
// the project name + owner slide into this bar, so you always know where you are
// without a tall header covering the board.
export function ProjectStickyBar({
  projectId,
  title,
  hue,
  ownerText,
  readOnly,
}: {
  projectId: string;
  title: string;
  hue: number;
  ownerText: string | null;
  readOnly: boolean;
}) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const target = document.getElementById("project-header-info");
    if (!target) return;
    // Bar sits under the 3.5rem mobile app header; on desktop it's at the very top.
    const offset = window.matchMedia("(min-width: 768px)").matches ? 0 : 56;
    const observer = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), {
      rootMargin: `-${offset + 8}px 0px 0px 0px`,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 mt-3 border-b bg-background/80 backdrop-blur-xl transition-shadow md:top-0",
        condensed && "shadow-[0_8px_24px_-16px_oklch(0_0_0/0.5)]"
      )}
    >
      <div className="flex min-h-12 items-center gap-3 md:min-h-[3.25rem]">
        <AnimatePresence initial={false}>
          {condensed && (
            <motion.button
              type="button"
              key="identity"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              title="Back to project details"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-w-0 flex-1 items-center gap-2.5 pl-4 text-left sm:pl-6"
            >
              <span
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, oklch(0.68 0.18 ${hue}), oklch(0.55 0.2 ${(hue + 45) % 360}))` }}
              >
                {title.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{title}</span>
                  {readOnly && <Eye className="size-3.5 shrink-0 text-stage-review" aria-label="View only" />}
                </span>
                {ownerText && <span className="block truncate text-[11px] text-muted-foreground">{ownerText}</span>}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className={cn("min-w-0", condensed ? "ml-auto shrink-0" : "flex-1")}>
          <ProjectTabs projectId={projectId} compact={condensed} />
        </div>
      </div>
    </div>
  );
}
