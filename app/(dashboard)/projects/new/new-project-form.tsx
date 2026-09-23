"use client";

import { useActionState, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2, Lock, Search, Sparkles, X } from "lucide-react";
import { createProject, type ActionState } from "../actions";
import type { Profile } from "@/lib/types";
import { AssigneeAvatar } from "@/components/shared/badges";
import { roleLabel } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

const fieldCls =
  "w-full rounded-xl border border-input bg-background/60 px-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15";

function matches(u: Profile, q: string) {
  return !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
}

function MemberPicker({
  title,
  hint,
  users,
  selected,
  lockedId,
  onToggle,
  emptyHint,
}: {
  title: string;
  hint: string;
  users: Profile[];
  selected: Set<string>;
  lockedId?: string;
  onToggle: (id: string) => void;
  emptyHint: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = users.filter((u) => matches(u, q));

  return (
    <section className="rounded-2xl border bg-card/70 p-5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {title}
            <span className="ml-2 rounded-md bg-brand/12 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand">
              {selected.size} selected
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="group relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder={`Search ${title.toLowerCase()}`}
            aria-label={`Search ${title.toLowerCase()}`}
            className="h-9 w-full rounded-xl border border-input bg-background/60 pl-9 pr-8 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/50 focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((u) => {
            const on = selected.has(u.id);
            const locked = u.id === lockedId;
            return (
              <motion.button
                type="button"
                key={u.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                whileTap={locked ? undefined : { scale: 0.97 }}
                onClick={() => !locked && onToggle(u.id)}
                aria-pressed={on}
                title={locked ? "You manage projects you create" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                  on ? "border-brand/50 bg-brand/8 ring-1 ring-brand/30" : "hover:border-foreground/15 hover:bg-muted/50",
                  locked && "cursor-default"
                )}
              >
                <AssigneeAvatar profile={u} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {u.name}
                    {locked && <span className="rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">You</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{u.username} · {roleLabel(u.role)}
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    on ? "border-transparent bg-brand text-white" : "border-muted-foreground/30"
                  )}
                >
                  {locked ? (
                    <Lock className="size-2.5" strokeWidth={3} />
                  ) : (
                    <AnimatePresence>
                      {on && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check className="size-3" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  )}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {visible.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            {q ? `No one matches “${query}”.` : emptyHint}
          </p>
        )}
      </div>
    </section>
  );
}

export function NewProjectForm({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  // Controlled so React's automatic form reset after an action doesn't wipe input on a failed submit.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [managers, setManagers] = useState<Set<string>>(new Set([currentUserId]));
  const [developers, setDevelopers] = useState<Set<string>>(new Set());

  const managerPool = useMemo(() => users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER"), [users]);
  const developerPool = useMemo(
    () => users.filter((u) => (u.role === "DEVELOPER" || u.role === "MANAGER") && !managers.has(u.id)),
    [users, managers]
  );

  function toggleManager(id: string) {
    if (id === currentUserId) return;
    const next = new Set(managers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      setDevelopers((prev) => {
        if (!prev.has(id)) return prev;
        const d = new Set(prev);
        d.delete(id);
        return d;
      });
    }
    setManagers(next);
  }

  function toggleDeveloper(id: string) {
    setDevelopers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="stagger mt-8 space-y-5">
      {[...managers].map((id) => (
        <input key={`m-${id}`} type="hidden" name="managerIds" value={id} />
      ))}
      {[...developers].map((id) => (
        <input key={`d-${id}`} type="hidden" name="developerIds" value={id} />
      ))}

      <section className="space-y-4 rounded-2xl border bg-card/70 p-5 backdrop-blur">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
            Project title
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Revamp"
            className={cn(fieldCls, "h-11 text-base font-medium")}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            className={cn(fieldCls, "resize-none py-2.5")}
          />
        </div>
      </section>

      <MemberPicker
        title="Managers"
        hint="Can create stories, manage members, and delete items."
        users={managerPool}
        selected={managers}
        lockedId={currentUserId}
        onToggle={toggleManager}
        emptyHint="No managers available."
      />
      <MemberPicker
        title="Developers"
        hint="Can create tasks and subtasks and move work across the board. People chosen as Managers above aren't listed."
        users={developerPool}
        selected={developers}
        onToggle={toggleDeveloper}
        emptyHint="Everyone eligible is already a Manager on this project."
      />

      <AnimatePresence>
        {state.error && !pending && (
          <motion.p
            key={state.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end gap-3">
        <p className="text-xs text-muted-foreground">
          {managers.size} manager{managers.size === 1 ? "" : "s"} · {developers.size} developer{developers.size === 1 ? "" : "s"}
        </p>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient-animated px-6 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? "Creating project" : "Create project"}
        </button>
      </div>
    </form>
  );
}
