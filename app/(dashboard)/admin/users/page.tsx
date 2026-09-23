import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isAdmin(profile)) redirect("/projects");

  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="animate-fade-up">
        <p className="text-sm text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">People & access</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create accounts, assign roles, and control who can sign in.</p>
      </div>
      <UsersTable users={(users as Profile[]) ?? []} currentUserId={profile.id} />
    </div>
  );
}
