import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function RevenueCommandOsPage() {
  redirect('/revenue-command-os/cockpit')
}
