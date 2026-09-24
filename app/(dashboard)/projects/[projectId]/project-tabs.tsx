"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Columns3, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}/board`, label: "Board", icon: Columns3 },
    { href: `/projects/${projectId}/list`, label: "List", icon: ListTree },
  ];

  return (
    <div className="flex gap-1 px-4 sm:px-6 md:mt-4">
      {tabs.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-3 text-sm font-medium transition-colors md:min-h-0 md:flex-none md:pb-3 md:pt-1",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("size-4 transition-colors", active && "text-brand")} />
            {tab.label}
            {active && (
              <motion.span
                layoutId="project-tab-underline"
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-gradient"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
