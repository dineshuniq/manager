"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createUser, updateUser, setUserStatus, resetUserPassword } from "./actions";
import type { Profile, Role } from "@/lib/types";
import { roleLabel } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUser({}, formData);
      if (result.success) {
        toast.success("User created.");
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
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" /> Add user
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="DEVELOPER">
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">System Admin</SelectItem>
                <SelectItem value="MANAGER">Project Manager</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" name="email" type="email" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, open, onOpenChange }: { user: Profile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateUser({}, formData);
      if (result.success) {
        toast.success("User updated.");
        setError(undefined);
        onOpenChange(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.username}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select name="role" defaultValue={user.role}>
              <SelectTrigger id="edit-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">System Admin</SelectItem>
                <SelectItem value="MANAGER">Project Manager</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email (optional)</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={user.email ?? ""} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, open, onOpenChange }: { user: Profile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {user.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={pending || password.length < 6}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await resetUserPassword(user.id, password);
                    toast.success("Password reset.");
                    onOpenChange(false);
                    setPassword("");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to reset password.");
                  }
                })
              }
            >
              {pending ? "Saving..." : "Reset password"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [editing, setEditing] = useState<Profile | null>(null);
  const [resetting, setResetting] = useState<Profile | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateUserDialog />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.username}</TableCell>
                <TableCell>{roleLabel(u.role as Role)}</TableCell>
                <TableCell>
                  <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(u)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetting(u)}>
                        Reset password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={u.id === currentUserId}
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await setUserStatus(u.id, u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                              toast.success(u.status === "ACTIVE" ? "User deactivated." : "User activated.");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to update status.");
                            }
                          })
                        }
                      >
                        {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editing && (
        <EditUserDialog user={editing} open={!!editing} onOpenChange={(v) => !v && setEditing(null)} />
      )}
      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          open={!!resetting}
          onOpenChange={(v) => !v && setResetting(null)}
        />
      )}
    </div>
  );
}
