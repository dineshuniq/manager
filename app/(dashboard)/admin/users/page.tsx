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
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Create, update, and deactivate user accounts.
          </p>
        </div>
      </div>
      <UsersTable users={(users as Profile[]) ?? []} currentUserId={profile.id} />
    </div>
  );
}
