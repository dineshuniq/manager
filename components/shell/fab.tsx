"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const fabCls =
  "fixed right-4 z-30 inline-flex h-14 items-center gap-2 rounded-2xl bg-brand-gradient pl-4 pr-5 text-sm font-semibold text-white shadow-glow active:scale-95 disabled:opacity-70 md:hidden bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1rem)]";

// Mobile-only primary action, parked in the thumb zone just above the bottom nav.
export function Fab({
  label,
  onClick,
  href,
  busy = false,
  className,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  busy?: boolean;
  className?: string;
}) {
  const content = (
    <>
      {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" strokeWidth={2.5} />}
      {label}
    </>
  );
  const motionProps = {
    initial: { scale: 0.6, opacity: 0, y: 16 },
    animate: { scale: 1, opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 420, damping: 28, delay: 0.15 },
  };

  if (href) {
    return (
      <motion.div {...motionProps} className="contents">
        <Link href={href} className={cn(fabCls, className)}>
          {content}
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.button {...motionProps} type="button" onClick={onClick} disabled={busy} className={cn(fabCls, className)}>
      {content}
    </motion.button>
  );
}
