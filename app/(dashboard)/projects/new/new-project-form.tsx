"use client";

import { useActionState } from "react";
import { createProject, type ActionState } from "../actions";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

export function NewProjectForm({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  const managers = users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER");
  const developers = users.filter((u) => u.role === "DEVELOPER" || u.role === "MANAGER");

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">Managers</p>
          <div className="grid grid-cols-2 gap-2">
            {managers.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="managerIds"
                  value={u.id}
                  defaultChecked={u.id === currentUserId}
                  className="size-4"
                />
                {u.name} <span className="text-muted-foreground">({u.username})</span>
              </label>
            ))}
            {managers.length === 0 && (
              <p className="text-sm text-muted-foreground">No managers available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">Developers</p>
          <div className="grid grid-cols-2 gap-2">
            {developers.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="developerIds" value={u.id} className="size-4" />
                {u.name} <span className="text-muted-foreground">({u.username})</span>
              </label>
            ))}
            {developers.length === 0 && (
              <p className="text-sm text-muted-foreground">No developers available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
