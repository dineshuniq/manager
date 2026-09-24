"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSED_LINES = 2;

export function ProjectDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(true);
  const [overflows, setOverflows] = useState(false);
  const measureRef = useRef<HTMLParagraphElement>(null);

  // Measure an invisible full-length copy so the toggle only appears when the text exceeds two lines.
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      setOverflows(el.scrollHeight > lineHeight * COLLAPSED_LINES + 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const textCls = "whitespace-pre-line text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]";

  return (
    <div className="relative mt-1.5 max-w-3xl">
      <p ref={measureRef} aria-hidden className={cn(textCls, "pointer-events-none invisible absolute inset-x-0 top-0")}>
        {text}
      </p>

      <motion.div
        initial={false}
        animate={{ height: expanded || !overflows ? "auto" : `${COLLAPSED_LINES * 1.625}em` }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden text-sm"
      >
        <p id="project-description" className={textCls}>
          {text}
        </p>
        {overflows && !expanded && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-background/90 to-transparent" />
        )}
      </motion.div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="project-description"
          className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border bg-surface/60 px-4 text-sm font-medium text-foreground transition-all hover:border-brand/40 hover:bg-accent active:scale-[0.98] pointer-coarse:w-full pointer-coarse:justify-center pointer-coarse:min-h-11"
        >
          {expanded ? "Collapse description" : "Show full description"}
          <ChevronDown className={cn("size-4 text-brand transition-transform duration-300", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
