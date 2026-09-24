import "server-only";
import { createClient } from "@supabase/supabase-js";

// Re-checks a password on a throwaway client so the caller's own session cookies are untouched.
export async function verifyPassword(email: string, password: string) {
  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await verifier.auth.signInWithPassword({ email, password });
  if (error) return false;
  await verifier.auth.signOut({ scope: "local" });
  return true;
}
