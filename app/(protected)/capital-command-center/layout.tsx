import { requireAccess } from '@/lib/auth/requireAccess'

export default async function CapitalCommandCenterLayout({ children }: { children: React.ReactNode }) {
  await requireAccess(['capital.view', 'revenue.view', 'billing.view'])
  return <>{children}</>
}
