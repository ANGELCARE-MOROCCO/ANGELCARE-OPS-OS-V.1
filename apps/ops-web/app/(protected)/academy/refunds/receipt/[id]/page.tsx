import { redirect } from 'next/navigation'

export default async function RedirectToCleanRefundReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/academy-print/refunds/${encodeURIComponent(id)}`)
}
