export type Role = "ADMIN" | "MANAGER" | "DEVELOPER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type WorkItemType = "STORY" | "TASK" | "SUBTASK";
export type Stage = "UNASSIGNED" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectMemberRole = "MANAGER" | "DEVELOPER";

export const STAGES: Stage[] = ["UNASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED"];
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const WORK_ITEM_TYPES: WorkItemType[] = ["STORY", "TASK", "SUBTASK"];

export const STAGE_LABELS: Record<Stage, string> = {
  UNASSIGNED: "Unassigned",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

export interface Profile {
  id: string;
  username: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  member_role: ProjectMemberRole;
  profile?: Profile;
}

export interface WorkItem {
  id: string;
  project_id: string;
  parent_id: string | null;
  type: WorkItemType;
  title: string;
  description: string | null;
  assignee_id: string | null;
  stage: Stage;
  priority: Priority;
  due_date: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
