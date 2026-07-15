import { requireAccess } from '@/lib/auth/requireAccess'

export default async function VoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('voice.view')

  return <>{children}</>
}