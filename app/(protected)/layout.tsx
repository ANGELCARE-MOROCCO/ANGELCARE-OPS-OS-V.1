import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import VoicePhoneWidget from '@/app/components/VoicePhoneWidget'
import HRTimeClockWidget from '@/app/components/hr/HRTimeClockWidget'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import { AppQuickAccess } from '@/app/components/AppQuickAccess'
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
  <AppQuickAccess links={allowedLinks} />
    {/* 🔥 HR WIDGET (TOP RIGHT) */}
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 60,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <HRTimeClockWidget />
    </div>

    {children}

    <VoicePhoneWidget />

    {/* 🔥 AngelCare Connect (BOTTOM RIGHT SYSTEM) */}
    <AngelCareConnect />
  </>
  )
 }