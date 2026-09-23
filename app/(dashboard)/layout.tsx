import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { roleLabel } from "@/lib/rbac";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Users, LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 flex-col border-r bg-muted/20 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold">Project Manager</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
          >
            <LayoutGrid className="size-4" />
            Projects
          </Link>
          {isAdmin(profile) && (
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
            >
              <Users className="size-4" />
              Users
            </Link>
          )}
        </nav>
        <div className="mt-auto border-t pt-4">
          <p className="truncate px-2 text-sm font-medium">{profile.name}</p>
          <p className="truncate px-2 text-xs text-muted-foreground">{roleLabel(profile.role)}</p>
          <form action={logout} className="mt-2">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
