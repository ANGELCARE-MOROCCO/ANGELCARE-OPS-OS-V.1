
import { createEmailOSSupabaseClient } from "@/lib/email-os/production/supabase-server"
import type { EmailOSRole } from "@/lib/email-os/production/types"

export type EmailOSAuthContext = {
  userId: string
  email?: string
  role: EmailOSRole
  organizationId?: string
}

export async function resolveEmailOSAuthContext(request: Request): Promise<EmailOSAuthContext> {
  const authHeader = request.headers.get("authorization")
  const fallbackRole = request.headers.get("x-email-os-role") as EmailOSRole | null

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      userId: "local-dev-user",
      role: fallbackRole || "ceo"
    }
  }

  const token = authHeader.replace("Bearer ", "")
  const supabase = createEmailOSSupabaseClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new Error("Invalid Email-OS authenticated session")
  }

  const { data: profile } = await supabase
    .from("email_os_user_roles")
    .select("role, organization_id")
    .eq("user_id", data.user.id)
    .maybeSingle()

  return {
    userId: data.user.id,
    email: data.user.email || undefined,
    role: (profile?.role as EmailOSRole) || fallbackRole || "viewer",
    organizationId: profile?.organization_id || undefined
  }
}
