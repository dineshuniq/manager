"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { changePassword } from "@/app/(dashboard)/account/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-10 w-full rounded-xl border border-input bg-background/60 pl-3 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          required
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function strengthOf(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

function Form({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const strength = next ? strengthOf(next) : 0;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current.length > 0 && next.length >= 6 && confirm === next && !pending;

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await changePassword({}, formData);
          if (result.success) {
            toast.success("Password changed", { description: "Use your new password next time you sign in." });
            onDone();
          } else {
            setError(result.error);
          }
        })
      }
      className="space-y-4"
    >
      <PasswordField id="current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
      <PasswordField id="next" label="New password" value={next} onChange={setNext} autoComplete="new-password" />

      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full bg-muted transition-colors duration-300",
                i < strength && (strength <= 1 ? "bg-destructive" : strength === 2 ? "bg-stage-review" : "bg-stage-done")
              )}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {next ? STRENGTH_LABEL[strength] : "At least 6 characters. Mix cases, numbers, and symbols for a stronger password."}
        </p>
      </div>

      <PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {mismatch && <p className="-mt-2 text-xs text-destructive">Passwords don&apos;t match yet.</p>}

      <AnimatePresence>
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, x: 0 }}
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
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {pending ? "Updating" : "Update password"}
        </button>
      </DialogFooter>
    </form>
  );
}

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <span className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
            <KeyRound className="size-5" />
          </span>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Confirm your current password, then choose a new one.</DialogDescription>
        </DialogHeader>
        {open && <Form onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
