
import { createEmailOSId } from "./audit"
import { createEmailOSSupabaseClient } from "./supabase-server"
import type { EmailOSNotification } from "./types"

export function createNotification(input: Omit<EmailOSNotification, "id" | "createdAt" | "read">): EmailOSNotification {
  return {
    id: createEmailOSId("notif"),
    createdAt: new Date().toISOString(),
    read: false,
    ...input
  }
}

export async function persistNotification(input: Omit<EmailOSNotification, "id" | "createdAt" | "read">) {
  const notification = createNotification(input)
  const supabase = createEmailOSSupabaseClient()

  const { error } = await supabase.from("email_os_notifications").insert({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    priority: notification.priority,
    read: notification.read,
    created_at: notification.createdAt
  })

  if (error) throw error
  return notification
}
