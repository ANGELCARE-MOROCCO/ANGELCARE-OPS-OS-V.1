import FlashcardsStudioFrame from '@/components/flashcards-os/studio/FlashcardsStudioFrame'
import FlashcardsActionProvider from '@/components/flashcards-os/studio/FlashcardsActionFeedback'
export default function FlashcardsOSShell({ children }: { children: React.ReactNode }) { return <FlashcardsActionProvider><FlashcardsStudioFrame>{children}</FlashcardsStudioFrame></FlashcardsActionProvider> }
