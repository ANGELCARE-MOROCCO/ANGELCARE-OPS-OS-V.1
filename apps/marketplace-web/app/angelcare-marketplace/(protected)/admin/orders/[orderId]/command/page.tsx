import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  redirect(`/angelcare-marketplace/admin/orders/${orderId}`)
}
