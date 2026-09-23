import { getProjectContext } from "@/lib/data/project";
import { TreeView } from "@/components/list/tree-view";

export default async function ProjectListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { workItems, members, memberRole } = await getProjectContext(projectId);

  const canEdit = memberRole !== null;
  const canManage = memberRole === "ADMIN" || memberRole === "MANAGER";

  return (
    <div className="overflow-x-auto">
      <TreeView
        projectId={projectId}
        initialItems={workItems}
        members={members}
        canEdit={canEdit}
        canManage={canManage}
      />
    </div>
  );
}
