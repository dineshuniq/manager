"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile, usernameToInternalEmail } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, . _ -"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER"]),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export interface ActionState {
  error?: string;
  success?: boolean;
}

async function assertAdmin() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) {
    throw new Error("Only System Admins can manage users.");
  }
  return profile;
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Only System Admins can manage users." };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, username, password, role, email } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email: usernameToInternalEmail(username),
    password,
    email_confirm: true,
    user_metadata: {
      username,
      name,
      role,
      real_email: email || undefined,
    },
  });

  if (error) {
    const message = error.message.includes("already been registered")
      ? "That username is already taken."
      : error.message;
    return { error: message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER"]),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Only System Admins can manage users." };
  }

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { id, name, role, email } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ name, role: role as Role, email: email || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
  await assertAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
  if (error) throw new Error(error.message);

  // Also block sign-in at the auth layer when deactivated.
  await admin.auth.admin.updateUserById(userId, { ban_duration: status === "INACTIVE" ? "876000h" : "none" });

  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string, password: string) {
  await assertAdmin();
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
