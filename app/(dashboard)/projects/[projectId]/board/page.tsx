import { getProjectContext } from "@/lib/data/project";
import { KanbanBoard } from "@/components/kanban/board";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { workItems, members, memberRole } = await getProjectContext(projectId);

  const canEdit = memberRole !== null;

  return (
    <KanbanBoard projectId={projectId} initialItems={workItems} members={members} canEdit={canEdit} />
  );
}
