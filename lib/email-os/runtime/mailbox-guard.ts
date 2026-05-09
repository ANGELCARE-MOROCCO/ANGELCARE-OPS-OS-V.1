
import { createEmailOSSupabaseClient } from "@/lib/email-os/production/supabase-server"
import { hasEmailOSPermission } from "@/lib/email-os/production/rbac"
import type { EmailOSPermission } from "@/lib/email-os/production/types"
import type { EmailOSAuthContext } from "./auth-context"

export async function assertMailboxAccess(
  context: EmailOSAuthContext,
  mailboxId: string,
  permission: EmailOSPermission
) {
  if (!hasEmailOSPermission(context.role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }

  if (context.role === "ceo" || context.role === "operations_director") {
    return true
  }

  const supabase = createEmailOSSupabaseClient()

  const { data, error } = await supabase
    .from("email_os_mailbox_members")
    .select("id")
    .eq("user_id", context.userId)
    .eq("mailbox_id", mailboxId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Mailbox access denied")

  return true
}
