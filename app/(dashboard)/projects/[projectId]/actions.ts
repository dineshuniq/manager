"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Priority, Stage, WorkItemType } from "@/lib/types";

const createSchema = z.object({
  projectId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  type: z.enum(["STORY", "TASK", "SUBTASK"]),
  title: z.string().trim().min(1),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function createWorkItem(input: z.infer<typeof createSchema>) {
  const profile = await requireProfile();
  const parsed = createSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_items")
    .insert({
      project_id: parsed.projectId,
      parent_id: parsed.parentId,
      type: parsed.type,
      title: parsed.title,
      assignee_id: parsed.assigneeId ?? null,
      priority: parsed.priority,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${parsed.projectId}`);
  return data;
}

const updateSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  stage: z.enum(["UNASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
});

export async function updateWorkItem(input: z.infer<typeof updateSchema>) {
  await requireProfile();
  const parsed = updateSchema.parse(input);
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (parsed.title !== undefined) patch.title = parsed.title;
  if (parsed.description !== undefined) patch.description = parsed.description;
  if (parsed.assigneeId !== undefined) patch.assignee_id = parsed.assigneeId;
  if (parsed.stage !== undefined) patch.stage = parsed.stage;
  if (parsed.priority !== undefined) patch.priority = parsed.priority;
  if (parsed.dueDate !== undefined) patch.due_date = parsed.dueDate;
  if (parsed.position !== undefined) patch.position = parsed.position;

  const { error } = await supabase.from("work_items").update(patch).eq("id", parsed.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/projects/${parsed.projectId}`);
}

export async function deleteWorkItem(id: string, projectId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("work_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export type { Priority, Stage, WorkItemType };
