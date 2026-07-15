
import { contentCommandProductionApi } from "./client"

export async function createApprovalTask(input: {
  entityType: string
  entityId: string
  title: string
  owner?: string
  priority?: string
}) {
  return contentCommandProductionApi.saveTask({
    id: `task-${Date.now()}`,
    entity_type: input.entityType,
    entity_id: input.entityId,
    title: input.title,
    status: "review",
    owner: input.owner || "Marketing Director",
    priority: input.priority || "high",
    payload: { workflow: "approval" },
  })
}

export async function addCoordinationComment(input: {
  entityType: string
  entityId: string
  author?: string
  role?: string
  message: string
}) {
  return contentCommandProductionApi.saveComment({
    id: `comment-${Date.now()}`,
    entity_type: input.entityType,
    entity_id: input.entityId,
    author: input.author || "Workspace User",
    role: input.role || "team",
    message: input.message,
    payload: { source: "content-command-center" },
  })
}

export async function requestApproval(entityType: string, entityId: string, title: string) {
  await createApprovalTask({ entityType, entityId, title: `Approval requested: ${title}` })
  await contentCommandProductionApi.logActivity({
    entity_type: entityType,
    entity_id: entityId,
    action: "approval-requested",
    actor: "workspace-user",
    payload: { title },
  })
}
