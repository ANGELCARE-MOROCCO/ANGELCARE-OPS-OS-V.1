import type { ReactNode } from 'react'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import FlashcardsOSShell from '@/components/flashcards-os/FlashcardsOSShell'

export const dynamic = 'force-dynamic'

export default async function FlashcardsOSLayout({ children }: { children: ReactNode }) {
  await requireFlashcardsPageAccess('flashcards_os.view')
  return <FlashcardsOSShell>{children}</FlashcardsOSShell>
}
