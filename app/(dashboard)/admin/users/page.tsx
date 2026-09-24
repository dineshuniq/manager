import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canManageUsers(profile)) redirect("/projects");

  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="animate-fade-up">
        <p className="text-sm text-muted-foreground">{profile.role === "ADMIN" ? "Administration" : "Team management"}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">People & access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.role === "ADMIN"
            ? "Create accounts, assign roles, and control who can sign in."
            : "Add teammates, swap Manager and Developer roles, and control who can sign in. Admin accounts are managed by Admins."}
        </p>
      </div>
      <UsersTable users={(users as Profile[]) ?? []} actor={{ id: profile.id, role: profile.role }} />
    </div>
  );
}
