import type { Profile, ProjectMemberRole, Role } from "@/lib/types";

export function isAdmin(profile: Pick<Profile, "role"> | null | undefined) {
  return profile?.role === "ADMIN";
}

export function canDeleteProject(
  profile: Pick<Profile, "id" | "role"> | null | undefined,
  project: { created_by: string | null }
) {
  return !!profile && (profile.role === "ADMIN" || project.created_by === profile.id);
}

export function canCreateProject(profile: Pick<Profile, "role"> | null | undefined) {
  return profile?.role === "ADMIN" || profile?.role === "MANAGER";
}

export function canManageProject(
  profile: Pick<Profile, "role"> | null | undefined,
  memberRole: ProjectMemberRole | null | undefined
) {
  return profile?.role === "ADMIN" || memberRole === "MANAGER";
}

export function canCreateStory(
  profile: Pick<Profile, "role"> | null | undefined,
  memberRole: ProjectMemberRole | null | undefined
) {
  return canManageProject(profile, memberRole);
}

type Actor = Pick<Profile, "id" | "role"> | null | undefined;
type Target = Pick<Profile, "id" | "role">;

export function canManageUsers(actor: Pick<Profile, "role"> | null | undefined) {
  return actor?.role === "ADMIN" || actor?.role === "MANAGER";
}

// Managers can hand out Manager/Developer only — never Admin — so they can't escalate anyone, including themselves.
export function assignableRoles(actor: Pick<Profile, "role"> | null | undefined): Role[] {
  if (actor?.role === "ADMIN") return ["ADMIN", "MANAGER", "DEVELOPER"];
  if (actor?.role === "MANAGER") return ["MANAGER", "DEVELOPER"];
  return [];
}

export function canEditUser(actor: Actor, target: Target) {
  if (!actor || !canManageUsers(actor)) return false;
  if (actor.role === "ADMIN") return true;
  return target.role !== "ADMIN";
}

// Nobody changes their own role or deactivates themselves (prevents self-escalation and last-admin lockout).
export function canChangeRole(actor: Actor, target: Target) {
  return canEditUser(actor, target) && actor!.id !== target.id;
}

// Only System Admins reset other people's passwords; everyone changes their own via Change password.
export function canResetPassword(actor: Actor, target: Target) {
  return actor?.role === "ADMIN" && actor.id !== target.id;
}

export function canChangeStatus(actor: Actor, target: Target) {
  return canEditUser(actor, target) && actor!.id !== target.id;
}

export function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "System Admin";
    case "MANAGER":
      return "Project Manager";
    case "DEVELOPER":
      return "Developer";
  }
}
