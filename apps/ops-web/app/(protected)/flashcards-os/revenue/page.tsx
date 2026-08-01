import RevenueCommandBridge from '@/components/flashcards-os/revenue/RevenueCommandBridge'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadRevenueOverview } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_revenue');return <RevenueCommandBridge data={await loadRevenueOverview()}/>}
