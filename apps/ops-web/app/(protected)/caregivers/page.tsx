import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CaregiversPage() {
  redirect('/carelink-ops/agents')
}
