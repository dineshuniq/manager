"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Loader2, UserPlus, Users, X } from "lucide-react";
import { addProjectMember, removeProjectMember } from "../actions";
import type { Profile, ProjectMemberRole } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssigneeAvatar } from "@/components/shared/badges";
import { cn } from "@/lib/utils";

export function MembersDialog({
  projectId,
  members,
  allUsers,
}: {
  projectId: string;
  members: (Profile & { member_role: ProjectMemberRole })[];
  allUsers: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("DEVELOPER");

  const memberIds = new Set(members.map((m) => m.id));
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border bg-surface/60 px-3 text-sm font-medium transition-all hover:border-brand/30 hover:bg-accent">
        <Users className="size-4 text-brand" />
        <span className="hidden sm:inline">Members</span>
        <span className="rounded-md bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{members.length}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project members</DialogTitle>
          <DialogDescription>Managers can edit everything; developers move work forward.</DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {members.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group flex items-center gap-3 rounded-xl border bg-card/60 px-3 py-2"
              >
                <AssigneeAvatar profile={m} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    m.member_role === "MANAGER"
                      ? "bg-brand/12 text-brand ring-brand/25"
                      : "bg-stage-progress/12 text-stage-progress ring-stage-progress/25"
                  )}
                >
                  {m.member_role === "MANAGER" ? "Manager" : "Developer"}
                </span>
                <button
                  disabled={pending}
                  aria-label={`Remove ${m.name}`}
                  onClick={() => {
                    setBusyId(m.id);
                    startTransition(async () => {
                      try {
                        await removeProjectMember(projectId, m.id);
                        toast.success(`${m.name} removed`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed to remove member.");
                      } finally {
                        setBusyId(null);
                      }
                    });
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  {busyId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {members.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>}
        </div>

        <div className="space-y-2 rounded-xl border border-dashed bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Add a member</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v ?? "")}>
              <SelectTrigger className="w-full flex-1">
                <SelectValue placeholder={available.length ? "Choose a user" : "Everyone's already here"} />
              </SelectTrigger>
              <SelectContent>
                {available.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <AssigneeAvatar profile={u} size="xs" /> {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={(v) => v && setSelectedRole(v as ProjectMemberRole)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
              </SelectContent>
            </Select>
            <button
              disabled={!selectedUser || pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await addProjectMember({ projectId, userId: selectedUser, memberRole: selectedRole });
                    toast.success("Member added");
                    setSelectedUser("");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to add member.");
                  }
                })
              }
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
            >
              {pending && !busyId ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Add
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
