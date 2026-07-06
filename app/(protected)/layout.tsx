import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import VoicePhoneWidgetGate from '@/app/components/VoicePhoneWidgetGate'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import OverheadPanel from '@/app/components/erp/OverheadPanel'
import AppShell from '@/app/components/erp/AppShell'
import UserActivityTracker from '@/components/users/UserActivityTracker'
import { MODULE_ACCESS_LINKS } from '@/lib/auth/permissions'
import OpsosTelemetryProvider from '@/components/opsos-control-plane/OpsosTelemetryProvider'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const allowedLinks =
    user.role === 'ceo'
      ? MODULE_ACCESS_LINKS
      : MODULE_ACCESS_LINKS.filter((link) =>
          user.permissions?.includes(link.permission)
        )

  return (
    <>
      <UserActivityTracker />

      {/* Global overhead navigation panel */}
      <OverheadPanel />

      {/* Global permission-based quick access menu */}

      {/* Global protected content offset: keeps every logged-in page below the fixed overhead panel */}
      <div style={{ paddingTop: 86, minHeight: '100vh' }}>
        <OpsosTelemetryProvider>{children}</OpsosTelemetryProvider>
      </div>

      {/* Global voice terminal */}
      <VoicePhoneWidgetGate />

      {/* AngelCare Connect bottom-right system */}
      <AngelCareConnect />
    </>
  )
}