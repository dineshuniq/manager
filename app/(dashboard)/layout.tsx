import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/shell/app-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <div className="relative flex min-h-svh flex-col md:flex-row">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/3 size-[36rem] rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute -top-20 right-0 size-[28rem] rounded-full bg-brand-2/8 blur-[120px]" />
      </div>
      <AppSidebar profile={profile} projects={projects ?? []} />
      <main className="min-w-0 flex-1 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
    </div>
  );
}
