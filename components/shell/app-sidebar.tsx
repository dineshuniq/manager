"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { ChevronsUpDown, FolderKanban, KeyRound, LogOut, Menu, Users } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/shared/logo";
import { AssigneeAvatar } from "@/components/shared/badges";
import { ThemeToggle } from "@/components/theme";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "./change-password-dialog";
import { roleLabel } from "@/lib/rbac";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavProject {
  id: string;
  title: string;
}

function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function NavContent({
  profile,
  projects,
  onNavigate,
  onChangePassword,
  layoutGroup,
}: {
  profile: Profile;
  projects: NavProject[];
  onNavigate?: () => void;
  onChangePassword: () => void;
  layoutGroup: string;
}) {
  const pathname = usePathname() ?? "";
  const [, startSignOut] = useTransition();

  const items = [
    { href: "/projects", label: "Projects", icon: FolderKanban, active: pathname === "/projects" || pathname === "/projects/new" },
    ...(profile.role === "ADMIN" || profile.role === "MANAGER"
      ? [{ href: "/admin/users", label: "Users", icon: Users, active: pathname.startsWith("/admin/users") }]
      : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-6 pt-5">
        <Link href="/projects" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="space-y-0.5 px-3">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </p>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              item.active ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {item.active && (
              <motion.span
                layoutId={`${layoutGroup}-nav-active`}
                className="absolute inset-0 rounded-lg bg-accent shadow-sm ring-1 ring-brand/15"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <item.icon className={cn("relative size-4", item.active && "text-brand")} />
            <span className="relative">{item.label}</span>
          </Link>
        ))}
      </nav>

      {projects.length > 0 && (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Projects
          </p>
          <div className="space-y-0.5">
            {projects.map((p) => {
              const active = pathname.startsWith(`/projects/${p.id}`);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/board`}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`${layoutGroup}-nav-active`}
                      className="absolute inset-0 rounded-lg bg-accent shadow-sm ring-1 ring-brand/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className="relative size-2.5 shrink-0 rounded-[4px]"
                    style={{ background: `oklch(0.66 0.18 ${hue(p.id)})` }}
                  />
                  <span className="relative truncate">{p.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto p-3">
        <div className="flex items-center gap-1 rounded-xl border bg-surface/60 p-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 data-[popup-open]:bg-accent/60"
            >
              <AssigneeAvatar profile={profile} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-tight">{profile.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  @{profile.username} · {roleLabel(profile.role)}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <AssigneeAvatar profile={profile} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{profile.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onChangePassword}>
                <KeyRound className="size-4" /> Change password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => startSignOut(() => logout())}>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({ profile, projects }: { profile: Profile; projects: NavProject[] }) {
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <>
      <aside className="glass sticky top-0 hidden h-svh w-64 shrink-0 border-r md:block">
        <NavContent profile={profile} projects={projects} layoutGroup="desktop" onChangePassword={() => setPasswordOpen(true)} />
      </aside>

      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <Link href="/projects">
          <Logo />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="inline-flex size-9 items-center justify-center rounded-lg border bg-surface/60 text-muted-foreground"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <NavContent
              profile={profile}
              projects={projects}
              onNavigate={() => setOpen(false)}
              onChangePassword={() => {
                setOpen(false);
                setPasswordOpen(true);
              }}
              layoutGroup="mobile"
            />
          </SheetContent>
        </Sheet>
      </header>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
