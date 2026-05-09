
import { emailOSFetch } from "./api-client"

export type PersistableEmailEntity =
  | "mailbox"
  | "thread"
  | "draft"
  | "template"
  | "automation"
  | "approval"
  | "audit"
  | "queue"
  | "notification"

export async function persistEmailOSEntity<TPayload extends Record<string, unknown>>(
  entity: PersistableEmailEntity,
  payload: TPayload
) {
  return emailOSFetch(`/api/email-os/v12/${entity}`, {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function updateEmailOSEntity<TPayload extends Record<string, unknown>>(
  entity: PersistableEmailEntity,
  id: string,
  payload: TPayload
) {
  return emailOSFetch(`/api/email-os/v12/${entity}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  })
}

export async function deleteEmailOSEntity(entity: PersistableEmailEntity, id: string) {
  return emailOSFetch(`/api/email-os/v12/${entity}/${encodeURIComponent(id)}`, {
    method: "DELETE"
  })
}

export async function loadEmailOSEntity<T = unknown>(entity: PersistableEmailEntity, id?: string) {
  const path = id
    ? `/api/email-os/v12/${entity}/${encodeURIComponent(id)}`
    : `/api/email-os/v12/${entity}`

  return emailOSFetch<T>(path)
}
