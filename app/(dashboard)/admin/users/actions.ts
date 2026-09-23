"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile, usernameToInternalEmail } from "@/lib/auth";
import { assignableRoles, canChangeRole, canChangeStatus, canEditUser, canManageUsers, canResetPassword, roleLabel } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, Role } from "@/lib/types";

// Every action here uses the service-role client, which bypasses RLS, so each one
// re-checks the caller's permissions against the target user before writing.

const roleEnum = z.enum(["ADMIN", "MANAGER", "DEVELOPER"]);

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, . _ -"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: roleEnum,
  email: z.string().trim().email().optional().or(z.literal("")),
});

export interface ActionState {
  error?: string;
  success?: boolean;
}

class PermissionError extends Error {}

async function requireUserManager() {
  const actor = await requireProfile();
  if (!canManageUsers(actor)) throw new PermissionError("Only Admins and Managers can manage users.");
  return actor;
}

async function loadTarget(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, role, name").eq("id", id).maybeSingle();
  if (!data) throw new PermissionError("That user no longer exists.");
  return data as Pick<Profile, "id" | "role" | "name">;
}

function assertAssignable(actor: Pick<Profile, "role">, role: Role) {
  if (!assignableRoles(actor).includes(role)) {
    throw new PermissionError(`You can't assign the ${roleLabel(role)} role.`);
  }
}

function toState(e: unknown): ActionState {
  return { error: e instanceof PermissionError || e instanceof Error ? e.message : "Something went wrong." };
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUserManager();
    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      username: formData.get("username"),
      password: formData.get("password"),
      role: formData.get("role"),
      email: formData.get("email") ?? "",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

    const { name, username, password, role, email } = parsed.data;
    assertAssignable(actor, role);

    const { error } = await createAdminClient().auth.admin.createUser({
      email: usernameToInternalEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username: username.toLowerCase(), name, role, real_email: email || undefined },
    });
    if (error) {
      return { error: error.message.includes("already been registered") ? "That username is already taken." : error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return toState(e);
  }
}

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required"),
  role: roleEnum,
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUserManager();
    const parsed = updateUserSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      role: formData.get("role"),
      email: formData.get("email") ?? "",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

    const { id, name, role, email } = parsed.data;
    const target = await loadTarget(id);
    if (!canEditUser(actor, target)) return { error: "You don't have permission to edit this user." };

    const patch: Partial<Profile> = { name, email: email || null };
    if (role !== target.role) {
      if (!canChangeRole(actor, target)) return { error: "You can't change your own role." };
      assertAssignable(actor, role);
      patch.role = role;
    }

    const { error } = await createAdminClient().from("profiles").update(patch).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return toState(e);
  }
}

export async function setUserRole(userId: string, role: Role): Promise<ActionState> {
  try {
    const actor = await requireUserManager();
    const parsedRole = roleEnum.parse(role);
    const target = await loadTarget(userId);
    if (!canChangeRole(actor, target)) {
      return { error: actor.id === target.id ? "You can't change your own role." : "You don't have permission to change this user's role." };
    }
    assertAssignable(actor, parsedRole);

    const { error } = await createAdminClient().from("profiles").update({ role: parsedRole }).eq("id", userId);
    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return toState(e);
  }
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE"): Promise<ActionState> {
  try {
    const actor = await requireUserManager();
    const target = await loadTarget(userId);
    if (!canChangeStatus(actor, target)) {
      return { error: actor.id === target.id ? "You can't deactivate yourself." : "You don't have permission to change this user's status." };
    }

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
    if (error) return { error: error.message };

    // Block sign-in at the auth layer too, so an existing password stops working immediately.
    await admin.auth.admin.updateUserById(userId, { ban_duration: status === "INACTIVE" ? "876000h" : "none" });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return toState(e);
  }
}

export async function resetUserPassword(userId: string, password: string): Promise<ActionState> {
  try {
    const actor = await requireUserManager();
    if (password.length < 6) return { error: "Password must be at least 6 characters." };
    const target = await loadTarget(userId);
    if (!canResetPassword(actor, target)) {
      return {
        error:
          actor.id === target.id
            ? "Use Change password in your account menu to update your own password."
            : "Only System Admins can reset other people's passwords.",
      };
    }

    const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password });
    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return toState(e);
  }
}
