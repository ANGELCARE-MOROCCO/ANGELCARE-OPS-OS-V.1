import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import VoicePhoneWidget from '@/app/components/VoicePhoneWidget'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import OverheadPanel from '@/app/components/erp/OverheadPanel'
import AppShell from '@/app/components/erp/AppShell'
import { MODULE_ACCESS_LINKS } from '@/lib/auth/permissions'

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
      {/* Global overhead navigation panel */}
      <OverheadPanel />

      {/* Global permission-based quick access menu */}

      {/* Global sidebar shell */}
  {children}


      {/* Global voice terminal */}
      <VoicePhoneWidget />

      {/* AngelCare Connect bottom-right system */}
      <AngelCareConnect />
    </>
  )
}