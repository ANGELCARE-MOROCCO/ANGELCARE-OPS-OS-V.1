export type ContentCommandAction = "create" | "edit" | "delete" | "review" | "approve" | "publish" | "archive" | "duplicate"
export type ContentCommandLog = { id: string; action: ContentCommandAction; targetId: string; message: string; createdAt: string }
export function makeContentCommandLog(action: ContentCommandAction, targetId: string, message: string): ContentCommandLog {
  return { id: `content-log-${Date.now()}-${Math.random().toString(16).slice(2)}`, action, targetId, message, createdAt: new Date().toISOString() }
}
export function contentCommandReadiness(score: number) {
  if (score >= 90) return "executive-ready"
  if (score >= 75) return "approval-ready"
  if (score >= 55) return "production-needed"
  return "at-risk"
}
