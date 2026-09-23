"use server";

import { z } from "zod";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(6, "New password must be at least 6 characters.").max(72, "New password is too long."),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "New passwords don't match.", path: ["confirm"] })
  .refine((v) => v.next !== v.current, { message: "New password must be different from the current one.", path: ["next"] });

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const parsed = schema.safeParse({
    current: formData.get("current") ?? "",
    next: formData.get("next") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has expired. Sign in again." };

  // Verify the current password on a throwaway client so the user's own session cookies stay untouched.
  const verifier = createStatelessClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current,
  });
  if (verifyError) return { error: "Current password is incorrect." };
  await verifier.auth.signOut({ scope: "local" });

  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) return { error: error.message };

  return { success: true };
}
