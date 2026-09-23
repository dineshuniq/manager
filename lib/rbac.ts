import type { Profile, ProjectMemberRole, Role } from "@/lib/types";

export function isAdmin(profile: Pick<Profile, "role"> | null | undefined) {
  return profile?.role === "ADMIN";
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
