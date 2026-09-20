import { getStudioWorkflowDescriptor } from './registry'
import type { StudioWorkflowReference } from './types'
export function isStudioWorkflowReference(value:unknown):value is StudioWorkflowReference{
  if(!value||typeof value!=='object'||Array.isArray(value))return false
  const row=value as Record<string,unknown>;if(row.version!==1||typeof row.workflowId!=='string'||!getStudioWorkflowDescriptor(row.workflowId))return false
  if(row.target!=null){if(typeof row.target!=='object'||Array.isArray(row.target))return false;const t=row.target as Record<string,unknown>;if(typeof t.sourceId!=='string'||typeof t.entityId!=='string'||!t.sourceId||!t.entityId)return false}
  return true
}
