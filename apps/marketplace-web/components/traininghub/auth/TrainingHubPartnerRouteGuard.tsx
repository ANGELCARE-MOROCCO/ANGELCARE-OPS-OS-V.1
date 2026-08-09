'use client'

// Stabilized intentionally.
// TrainingHub server pages already enforce access with requireTrainingHubPageContext()
// and @supabase/ssr cookies. This client guard previously caused the login ping-pong:
// /traininghub/login -> /traininghub -> /traininghub/login?error=session_required.
// Keep it inert unless a future audited partner-only layout needs a dedicated client guard.
export default function TrainingHubPartnerRouteGuard() {
  return null
}
