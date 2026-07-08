import { redirect } from 'next/navigation'
import type { Angelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export type Angelcare360InventoryContext = Omit<Angelcare360AccessContext, 'school'> & {
  school: NonNullable<Angelcare360AccessContext['school']>
}

export async function getAngelcare360InventoryContext(): Promise<Angelcare360InventoryContext> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('inventaire.view', { context })
  return context as Angelcare360InventoryContext
}

export const inventoryPrimaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

export const inventorySecondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

export const inventoryBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#f0f9ff',
  color: '#0369a1',
  fontSize: 12,
  fontWeight: 900,
}
