"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, Check, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { deleteProject } from "../actions";
import { projectSlug } from "@/lib/slug";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-destructive/50 focus:bg-background focus:ring-4 focus:ring-destructive/10 sm:h-10";

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function Form({
  projectId,
  title,
  itemCount,
  memberCount,
}: {
  projectId: string;
  title: string;
  itemCount: number;
  memberCount: number;
}) {
  const router = useRouter();
  const slug = projectSlug(title);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const slugOk = typed.trim() === slug;
  const canSubmit = slugOk && password.length > 0 && !pending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(undefined);
        startTransition(async () => {
          const result = await deleteProject({ projectId, slug: typed.trim(), password });
          if (result.success) {
            toast.success(`“${title}” deleted`, { description: `${plural(itemCount, "work item")} removed.` });
            router.replace("/projects");
            router.refresh();
          } else {
            setError(result.error);
            setPassword("");
          }
        });
      }}
      className="space-y-4"
    >
      <div className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-muted-foreground">
          This permanently deletes <span className="font-semibold text-foreground">{title}</span>, its{" "}
          <span className="font-semibold text-foreground">{plural(itemCount, "work item")}</span> and{" "}
          <span className="font-semibold text-foreground">{plural(memberCount, "membership")}</span>. This can&apos;t be undone.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-slug" className="block text-xs font-medium text-muted-foreground">
          Type <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">{slug}</code> to confirm
        </label>
        <div className="relative">
          <input
            id="confirm-slug"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="text"
            placeholder={slug}
            className={cn(fieldCls, "pr-10 font-mono", slugOk && "border-stage-done/50 focus:border-stage-done/60 focus:ring-stage-done/15")}
          />
          <AnimatePresence>
            {slugOk && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-stage-done text-white"
              >
                <Check className="size-3" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="block text-xs font-medium text-muted-foreground">
          Your password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={cn(fieldCls, "pr-11")}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <DialogFooter>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {pending ? "Deleting…" : "Delete this project"}
        </button>
      </DialogFooter>
    </form>
  );
}

export function DeleteProjectDialog(props: { projectId: string; title: string; itemCount: number; memberCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Delete project"
        title="Delete project"
        className="inline-flex h-9 items-center gap-2 rounded-xl border bg-surface/60 px-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive pointer-coarse:size-10 pointer-coarse:justify-center pointer-coarse:px-0"
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>Only the project owner can do this.</DialogDescription>
        </DialogHeader>
        {open && <Form {...props} />}
      </DialogContent>
    </Dialog>
  );
}
