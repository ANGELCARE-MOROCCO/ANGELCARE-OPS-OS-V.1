import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import VoicePhoneWidget from '@/app/components/VoicePhoneWidget'
import HRTimeClockWidget from '@/app/components/hr/HRTimeClockWidget'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
  <>
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