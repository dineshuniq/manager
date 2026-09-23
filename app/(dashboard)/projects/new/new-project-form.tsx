"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { createProject, type ActionState } from "../actions";
import type { Profile } from "@/lib/types";
import { AssigneeAvatar } from "@/components/shared/badges";
import { roleLabel } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

const fieldCls =
  "w-full rounded-xl border border-input bg-background/60 px-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15";

function MemberPicker({
  title,
  hint,
  name,
  users,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  name: string;
  users: Profile[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border bg-card/70 p-5 backdrop-blur">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {users.map((u) => {
          const on = selected.has(u.id);
          return (
            <motion.button
              type="button"
              key={u.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggle(u.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                on ? "border-brand/50 bg-brand/8 ring-1 ring-brand/30" : "hover:border-foreground/15 hover:bg-muted/50"
              )}
            >
              <AssigneeAvatar profile={u} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{u.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{u.username} · {roleLabel(u.role)}
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border transition-all",
                  on ? "border-transparent bg-brand text-white" : "border-muted-foreground/30"
                )}
              >
                <AnimatePresence>
                  {on && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              {on && <input type="hidden" name={name} value={u.id} />}
            </motion.button>
          );
        })}
        {users.length === 0 && <p className="text-sm text-muted-foreground">No eligible users yet.</p>}
      </div>
    </section>
  );
}

export function NewProjectForm({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  const [managers, setManagers] = useState<Set<string>>(new Set([currentUserId]));
  const [developers, setDevelopers] = useState<Set<string>>(new Set());

  const managerPool = users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER");
  const developerPool = users.filter((u) => u.role === "DEVELOPER" || u.role === "MANAGER");

  const toggle = (setter: typeof setManagers) => (id: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form action={formAction} className="stagger mt-8 space-y-5">
      <section className="space-y-4 rounded-2xl border bg-card/70 p-5 backdrop-blur">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
            Project title
          </label>
          <input id="title" name="title" required placeholder="e.g. Website Revamp" className={cn(fieldCls, "h-11 text-base font-medium")} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What is this project about?"
            className={cn(fieldCls, "resize-none py-2.5")}
          />
        </div>
      </section>

      <MemberPicker
        title="Managers"
        hint="Can create stories, manage members, and delete items."
        name="managerIds"
        users={managerPool}
        selected={managers}
        onToggle={toggle(setManagers)}
      />
      <MemberPicker
        title="Developers"
        hint="Can create tasks and subtasks and move work across the board."
        name="developerIds"
        users={developerPool}
        selected={developers}
        onToggle={toggle(setDevelopers)}
      />

      {state.error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient-animated px-6 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? "Creating project" : "Create project"}
        </button>
      </div>
    </form>
  );
}
