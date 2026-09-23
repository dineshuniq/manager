"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeftRight, Check, ChevronDown, KeyRound, Loader2, Lock, MoreHorizontal, Pencil, Plus, Power, Search, Shield, UserCog, Users, Code2 } from "lucide-react";
import { createUser, updateUser, setUserRole, setUserStatus, resetUserPassword } from "./actions";
import type { Profile, Role } from "@/lib/types";
import { assignableRoles, canChangeRole, canChangeStatus, canEditUser, roleLabel } from "@/lib/rbac";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssigneeAvatar } from "@/components/shared/badges";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-brand-2/12 text-brand-2 ring-brand-2/25",
  MANAGER: "bg-brand/12 text-brand ring-brand/25",
  DEVELOPER: "bg-stage-progress/12 text-stage-progress ring-stage-progress/25",
};

const fieldCls =
  "h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-xs font-medium text-muted-foreground">
        {label}
        {hint && <span className="font-normal text-muted-foreground/70">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

type Actor = Pick<Profile, "id" | "role">;

function RoleSelect({ id, defaultValue, roles }: { id: string; defaultValue: Role; roles: Role[] }) {
  return (
    <Select name="role" defaultValue={defaultValue}>
      <SelectTrigger id={id} className="h-10 w-full rounded-xl">
        <SelectValue>{(v: Role) => roleLabel(v)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r} value={r}>
            {roleLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RoleSwap({ user, actor, onSwap }: { user: Profile; actor: Actor; onSwap: (role: Role) => void }) {
  const [open, setOpen] = useState(false);
  const pill = (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", ROLE_STYLES[user.role])}>
      {roleLabel(user.role)}
    </span>
  );

  if (!canChangeRole(actor, user)) {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        title={user.id === actor.id ? "You can't change your own role" : "Only System Admins can change an Admin's role"}
      >
        {pill}
        {user.role === "ADMIN" && actor.role !== "ADMIN" && <Lock className="size-3 text-muted-foreground/60" />}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="group/role inline-flex items-center gap-1 rounded-full outline-none transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring/50"
        title="Change role"
      >
        {pill}
        <ChevronDown className="size-3 text-muted-foreground opacity-40 transition-opacity group-hover/role:opacity-100" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        <p className="flex items-center gap-1.5 px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <ArrowLeftRight className="size-3" /> Swap role
        </p>
        {assignableRoles(actor).map((r) => (
          <button
            key={r}
            onClick={() => {
              setOpen(false);
              if (r !== user.role) onSwap(r);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          >
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", ROLE_STYLES[r])}>{roleLabel(r)}</span>
            {r === user.role && <Check className="size-3.5 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

function ErrorNote({ error }: { error?: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function CreateUserDialog({ roles }: { roles: Role[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUser({}, formData);
      if (result.success) {
        toast.success("User created", { description: `@${formData.get("username")} can now sign in.` });
        setOpen(false);
        setError(undefined);
        formRef.current?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="group inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]">
        <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" /> Add user
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>They&apos;ll sign in with this username and password.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <Field label="Full name" htmlFor="name">
            <input id="name" name="name" required placeholder="Jane Doe" className={fieldCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" htmlFor="username">
              <input id="username" name="username" required placeholder="jane" className={fieldCls} />
            </Field>
            <Field label="Password" htmlFor="password" hint="6+ chars">
              <input id="password" name="password" type="password" required minLength={6} className={fieldCls} />
            </Field>
          </div>
          <Field label="Role" htmlFor="role">
            <RoleSelect id="role" defaultValue="DEVELOPER" roles={roles} />
          </Field>
          <Field label="Email" htmlFor="email" hint="optional">
            <input id="email" name="email" type="email" placeholder="jane@company.com" className={fieldCls} />
          </Field>
          <ErrorNote error={error} />
          <DialogFooter>
            <SubmitButton pending={pending}>{pending ? "Creating" : "Create user"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, actor, onOpenChange }: { user: Profile; actor: Actor; onOpenChange: (v: boolean) => void }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateUser({}, formData);
      if (result.success) {
        toast.success("User updated");
        onOpenChange(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AssigneeAvatar profile={user} size="lg" />
            <div>
              <DialogTitle>Edit {user.name}</DialogTitle>
              <DialogDescription>@{user.username}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <Field label="Full name" htmlFor="edit-name">
            <input id="edit-name" name="name" defaultValue={user.name} required className={fieldCls} />
          </Field>
          <Field label="Role" htmlFor="edit-role" hint={canChangeRole(actor, user) ? undefined : "locked"}>
            {canChangeRole(actor, user) ? (
              <RoleSelect id="edit-role" defaultValue={user.role} roles={assignableRoles(actor)} />
            ) : (
              <>
                <input type="hidden" name="role" value={user.role} />
                <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed px-3 text-sm text-muted-foreground">
                  <Lock className="size-3.5" /> {roleLabel(user.role)}
                  <span className="text-xs">· you can&apos;t change your own role</span>
                </div>
              </>
            )}
          </Field>
          <Field label="Email" htmlFor="edit-email" hint="optional">
            <input id="edit-email" name="email" type="email" defaultValue={user.email ?? ""} className={fieldCls} />
          </Field>
          <ErrorNote error={error} />
          <DialogFooter>
            <SubmitButton pending={pending}>{pending ? "Saving" : "Save changes"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onOpenChange }: { user: Profile; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const strength = Math.min(4, Math.floor(password.length / 3) + (/[^a-zA-Z0-9]/.test(password) ? 1 : 0));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for @{user.username}.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await resetUserPassword(user.id, password);
              if (result.success) {
                toast.success("Password reset", { description: `Share the new password with ${user.name}.` });
                onOpenChange(false);
              } else {
                toast.error(result.error ?? "Failed to reset password.");
              }
            });
          }}
          className="space-y-4"
        >
          <Field label="New password" htmlFor="new-password">
            <input
              id="new-password"
              type="password"
              autoFocus
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldCls}
            />
          </Field>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full bg-muted transition-colors duration-300",
                  i < strength && (strength <= 1 ? "bg-destructive" : strength <= 2 ? "bg-stage-review" : "bg-stage-done")
                )}
              />
            ))}
          </div>
          <DialogFooter>
            <SubmitButton pending={pending || password.length < 6}>{pending ? "Saving" : "Reset password"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ROLE_FILTERS: { value: "ALL" | Role; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "ADMIN", label: "Admins" },
  { value: "MANAGER", label: "Managers" },
  { value: "DEVELOPER", label: "Developers" },
];

export function UsersTable({ users: serverUsers, actor }: { users: Profile[]; actor: Actor }) {
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Role>>({});
  const users = useMemo(
    () => serverUsers.map((u) => (roleOverrides[u.id] ? { ...u, role: roleOverrides[u.id] } : u)),
    [serverUsers, roleOverrides]
  );
  const [editing, setEditing] = useState<Profile | null>(null);
  const [resetting, setResetting] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"ALL" | Role>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "ALL" || u.role === role) &&
        (!q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    );
  }, [users, query, role]);

  const counts = {
    total: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    MANAGER: users.filter((u) => u.role === "MANAGER").length,
    DEVELOPER: users.filter((u) => u.role === "DEVELOPER").length,
  };

  const tiles = [
    { label: "Total people", value: counts.total, icon: Users, cls: "bg-muted text-foreground" },
    { label: "System Admins", value: counts.ADMIN, icon: Shield, cls: "bg-brand-2/12 text-brand-2" },
    { label: "Project Managers", value: counts.MANAGER, icon: UserCog, cls: "bg-brand/12 text-brand" },
    { label: "Developers", value: counts.DEVELOPER, icon: Code2, cls: "bg-stage-progress/12 text-stage-progress" },
  ];

  function toggleStatus(u: Profile) {
    setBusyId(u.id);
    startTransition(async () => {
      const result = await setUserStatus(u.id, u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      if (result.success) toast.success(u.status === "ACTIVE" ? `${u.name} deactivated` : `${u.name} reactivated`);
      else toast.error(result.error ?? "Failed to update status.");
      setBusyId(null);
    });
  }

  function swapRole(u: Profile, next: Role) {
    const previous = u.role;
    setRoleOverrides((o) => ({ ...o, [u.id]: next }));
    startTransition(async () => {
      const result = await setUserRole(u.id, next);
      if (result.success) {
        toast.success(`${u.name} is now a ${roleLabel(next)}`);
      } else {
        setRoleOverrides((o) => ({ ...o, [u.id]: previous }));
        toast.error(result.error ?? "Couldn't change role — reverted.");
      }
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card/70 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
              <span className={cn("inline-flex size-7 items-center justify-center rounded-lg", t.cls)}>
                <t.icon className="size-3.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="h-10 w-56 rounded-xl border border-input bg-surface/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:w-64 focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
          />
        </div>
        <div className="flex h-10 items-center rounded-xl border bg-surface/60 p-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                "relative h-full rounded-lg px-3 text-xs font-medium transition-colors",
                role === r.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {role === r.value && (
                <motion.span
                  layoutId="role-filter-pill"
                  className="absolute inset-0 rounded-lg bg-accent shadow-sm ring-1 ring-brand/15"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{r.label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <CreateUserDialog roles={assignableRoles(actor)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card/70 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Person</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0 }}
                    className={cn("group border-b transition-colors last:border-0 hover:bg-accent/40", u.status === "INACTIVE" && "opacity-60")}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <AssigneeAvatar profile={u} size="md" className={cn(u.status === "INACTIVE" && "grayscale")} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium">
                            {u.name}
                            {u.id === actor.id && (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">You</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{u.username}
                            {u.email && ` · ${u.email}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleSwap user={u} actor={actor} onSwap={(r) => swapRole(u, r)} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 text-xs font-medium">
                        <span className="relative flex size-2">
                          {u.status === "ACTIVE" && (
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-stage-done opacity-50" />
                          )}
                          <span className={cn("relative inline-flex size-2 rounded-full", u.status === "ACTIVE" ? "bg-stage-done" : "bg-muted-foreground/50")} />
                        </span>
                        {u.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      {!canEditUser(actor, u) ? (
                        <span
                          title="Admin accounts are managed by System Admins"
                          className="inline-flex size-8 items-center justify-center text-muted-foreground/50"
                        >
                          <Lock className="size-3.5" />
                        </span>
                      ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          {busyId === u.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditing(u)}>
                            <Pencil className="size-4" /> Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetting(u)}>
                            <KeyRound className="size-4" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!canChangeStatus(actor, u)}
                            variant={u.status === "ACTIVE" ? "destructive" : "default"}
                            onClick={() => toggleStatus(u)}
                          >
                            <Power className="size-4" /> {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No one matches that search.</p>
          )}
        </div>
      </div>

      {editing && <EditUserDialog key={editing.id} user={editing} actor={actor} onOpenChange={(v) => !v && setEditing(null)} />}
      {resetting && <ResetPasswordDialog key={resetting.id} user={resetting} onOpenChange={(v) => !v && setResetting(null)} />}
    </div>
  );
}
