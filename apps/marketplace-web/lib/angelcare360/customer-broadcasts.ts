import 'server-only'

import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

export type Angelcare360CustomerBroadcastKind =
  | 'info'
  | 'maintenance'
  | 'guide'
  | 'security'
  | 'support'
  | 'release'
  | 'warning'

export type Angelcare360CustomerBroadcastItem = {
  id: string
  kind: Angelcare360CustomerBroadcastKind
  text: string
  occurredAt: string | null
}

export type Angelcare360CustomerBroadcastSnapshot = {
  version: string
  generatedAt: string
  source: 'operator_live' | 'fallback'
  items: Angelcare360CustomerBroadcastItem[]
}

const FALLBACK_ITEMS: Angelcare360CustomerBroadcastItem[] = [
  {
    id: 'service-information',
    kind: 'info',
    text: 'Informations service · Retrouvez ici les communications importantes AngelCare 360.',
    occurredAt: null,
  },
  {
    id: 'planned-maintenance',
    kind: 'maintenance',
    text: 'Maintenance · Toute intervention planifiée impactant le service sera annoncée dans ce fil.',
    occurredAt: null,
  },
  {
    id: 'customer-guides',
    kind: 'guide',
    text: 'Guides clients · Les nouvelles ressources de prise en main et d’exploitation sont signalées ici.',
    occurredAt: null,
  },
  {
    id: 'security-updates',
    kind: 'security',
    text: 'Sécurité · Les mises à jour importantes de protection et de conformité sont communiquées ici.',
    occurredAt: null,
  },
  {
    id: 'customer-support',
    kind: 'support',
    text: 'Support AngelCare · Les informations d’assistance et de disponibilité du service sont relayées ici.',
    occurredAt: null,
  },
]

function normalizeText(value: unknown, fallback = '') {
  return String(value ?? fallback).replace(/\s+/g, ' ').trim()
}

function broadcastKind(eventType: unknown, severity: unknown): Angelcare360CustomerBroadcastKind {
  const type = normalizeText(eventType).toLowerCase()
  const level = normalizeText(severity).toLowerCase()
  if (level === 'critical' || level === 'warning') return 'warning'
  if (type.includes('maintenance')) return 'maintenance'
  if (type.includes('guide') || type.includes('documentation')) return 'guide'
  if (type.includes('security')) return 'security'
  if (type.includes('support')) return 'support'
  if (type.includes('release') || type.includes('update')) return 'release'
  return 'info'
}

function versionFor(items: Angelcare360CustomerBroadcastItem[]) {
  return createHash('sha256')
    .update(JSON.stringify(items.map(({ id, kind, text, occurredAt }) => [id, kind, text, occurredAt])))
    .digest('hex')
    .slice(0, 20)
}

export async function getAngelcare360CustomerBroadcastSnapshot(): Promise<Angelcare360CustomerBroadcastSnapshot> {
  const generatedAt = new Date().toISOString()

  try {
    const db = await createServiceClient()
    const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db
      .from('angelcare360_operator_service_events')
      .select('id,event_type,severity,title,description,status,occurred_at')
      .is('client_id', null)
      .is('tenant_id', null)
      .like('event_type', 'customer_broadcast.%')
      .in('status', ['open', 'watching', 'resolved'])
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(10)

    if (!error && data?.length) {
      const live = data
        .map((row) => {
          const title = normalizeText(row.title)
          const description = normalizeText(row.description)
          const text = [title, description].filter(Boolean).join(' · ')
          return {
            id: String(row.id),
            kind: broadcastKind(row.event_type, row.severity),
            text,
            occurredAt: row.occurred_at ? String(row.occurred_at) : null,
          } satisfies Angelcare360CustomerBroadcastItem
        })
        .filter((item) => item.text)

      const items = [...live, ...FALLBACK_ITEMS].slice(0, 10)
      return {
        version: versionFor(items),
        generatedAt,
        source: 'operator_live',
        items,
      }
    }
  } catch {
    // The customer login must never depend on the broadcast service being available.
  }

  return {
    version: versionFor(FALLBACK_ITEMS),
    generatedAt,
    source: 'fallback',
    items: FALLBACK_ITEMS,
  }
}
