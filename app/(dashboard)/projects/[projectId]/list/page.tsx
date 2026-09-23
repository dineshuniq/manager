import { getProjectContext } from "@/lib/data/project";
import { TreeView } from "@/components/list/tree-view";

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { workItems, members, memberRole } = await getProjectContext(projectId);

  return (
    <TreeView
      projectId={projectId}
      initialItems={workItems}
      members={members}
      canEdit={memberRole !== null}
      canManage={memberRole === "ADMIN" || memberRole === "MANAGER"}
    />
  );
}
