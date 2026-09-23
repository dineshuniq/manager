import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl bg-brand-gradient-animated text-white shadow-glow",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-28 12 12)" opacity="0.9" />
      </svg>
      <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/25 to-transparent" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">Orbit</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">Project Manager</span>
      </span>
    </span>
  );
}
