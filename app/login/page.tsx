"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { login, type LoginState } from "./actions";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";

const initialState: LoginState = {};

const previewColumns = [
  { title: "In Progress", dot: "bg-stage-progress", cards: ["Checkout redesign", "Search indexing"] },
  { title: "Review", dot: "bg-stage-review", cards: ["Billing webhooks"] },
  { title: "Completed", dot: "bg-stage-done", cards: ["Auth flow", "Design tokens"] },
];

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -left-[15%] -top-[25%] size-[60vmax] animate-aurora rounded-full bg-brand/30 blur-[120px]" />
      <div
        className="absolute -right-[20%] top-[10%] size-[55vmax] animate-aurora rounded-full bg-brand-2/25 blur-[120px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-[-30%] left-[20%] size-[50vmax] animate-aurora rounded-full bg-brand-3/20 blur-[120px]"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-background/60 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/60 focus:bg-background focus:ring-4 focus:ring-brand/15";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-svh overflow-hidden">
      <Aurora />
      <ThemeToggle className="absolute right-4 top-4 z-20" />

      <div className="relative z-10 hidden flex-1 flex-col justify-between p-12 lg:flex">
        <Logo />
        <div className="max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-semibold leading-[1.05] tracking-tight"
          >
            Ship work that <span className="text-gradient">moves in orbit.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-lg text-muted-foreground"
          >
            Stories, tasks, and subtasks on one board. Drag work forward and watch progress roll up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid animate-float grid-cols-3 gap-3 rounded-2xl border bg-surface/60 p-3 shadow-lift backdrop-blur-xl"
          >
            {previewColumns.map((col, ci) => (
              <div key={col.title} className="rounded-xl bg-muted/50 p-2">
                <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-muted-foreground">
                  <span className={cn("size-1.5 rounded-full", col.dot)} />
                  {col.title}
                </div>
                <div className="space-y-2">
                  {col.cards.map((card, i) => (
                    <motion.div
                      key={card}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + ci * 0.15 + i * 0.1 }}
                      className="rounded-lg border bg-card p-2 text-[11px] font-medium shadow-sm"
                    >
                      {card}
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", ci === 2 ? "bg-stage-done" : "bg-brand-gradient")}
                          style={{ width: ci === 2 ? "100%" : `${40 + i * 25}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        <p className="text-xs text-muted-foreground">Role-based access · Row-level security · Real-time progress</p>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="relative rounded-3xl border bg-surface/70 p-8 shadow-lift backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-linear-to-r from-transparent via-brand/70 to-transparent" />
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your username to continue.</p>

            <form action={formAction} className="mt-7 space-y-4">
              <Field id="username" label="Username" icon={User}>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  autoFocus
                  placeholder="e.g. admin"
                  className={inputCls}
                />
              </Field>
              <Field id="password" label="Password" icon={Lock}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={cn(inputCls, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </Field>

              {state.error && (
                <motion.p
                  key={state.error + String(pending)}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  transition={{ duration: 0.4 }}
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {state.error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="group relative mt-2 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-gradient-animated text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Signing in
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are provisioned by your System Admin.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
