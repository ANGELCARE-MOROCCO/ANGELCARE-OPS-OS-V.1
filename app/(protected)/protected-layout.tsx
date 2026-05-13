import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import VoicePhoneWidget from '@/app/components/VoicePhoneWidget'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import OverheadPanel from '@/app/components/erp/OverheadPanel'
import { getAllowedModuleLinks } from '@/lib/auth/permissions'
import { PermissionNavigationProvider } from '@/components/navigation/PermissionNavigationProvider'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const allowedLinks = getAllowedModuleLinks(user)

  return (
    <>
      <PermissionNavigationProvider links={allowedLinks}>
        {/* Global overhead navigation panel */}
        <OverheadPanel />

        {/* Permission links are now available to every AppShell sidebar through context. */}

        {/* Global protected content offset: keeps every logged-in page below the fixed overhead panel */}
        <div style={{ paddingTop: 86, minHeight: '100vh' }}>
        {children}
        </div>

        {/* Global voice terminal */}
        <VoicePhoneWidget />

        {/* AngelCare Connect bottom-right system */}
        <AngelCareConnect />
      </PermissionNavigationProvider>
    </>
  )
}