"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addProjectMember, removeProjectMember } from "../actions";
import type { Profile, ProjectMemberRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";

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
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("DEVELOPER");

  const memberIds = new Set(members.map((m) => m.id));
  const available = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Users className="size-4" />
        Members ({members.length})
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project members</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{m.member_role}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await removeProjectMember(projectId, m.id);
                        toast.success("Member removed.");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed to remove member.");
                      }
                    })
                  }
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>

        <div className="flex items-end gap-2 border-t pt-4">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Add member</p>
            <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {available.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={selectedRole}
            onValueChange={(v) => v && setSelectedRole(v as ProjectMemberRole)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="DEVELOPER">Developer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={!selectedUser || pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await addProjectMember({ projectId, userId: selectedUser, memberRole: selectedRole });
                  toast.success("Member added.");
                  setSelectedUser("");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to add member.");
                }
              })
            }
          >
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
