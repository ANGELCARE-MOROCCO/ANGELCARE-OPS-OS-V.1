import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { AdminShellIndicator, AdminShellNotification, AdminShellSnapshot } from './types'

type Row = Record<string, unknown>
type QueryResult = { data?: unknown; count?: number | null; error?: { message?: string; code?: string } | null }

const text = (value: unknown) => typeof value === 'string' ? value : ''
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((row): row is Row => Boolean(row) && typeof row === 'object') : []
const displayTime = (value: unknown) => {
  const raw = text(value)
  if (!raw) return 'À traiter'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'À traiter'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

async function settle(query: PromiseLike<QueryResult>): Promise<QueryResult> {
  try {
    const result = await query
    return result?.error ? { data: [], count: 0, error: result.error } : result
  } catch {
    return { data: [], count: 0, error: { message: 'snapshot unavailable' } }
  }
}

export async function getAdminShellSnapshot(): Promise<AdminShellSnapshot> {
  const generatedAt = new Date().toISOString()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  try {
    const db = await createServiceClient()
    const openJourneyStatuses = ['registered', 'awaiting_customer', 'awaiting_angelcare', 'qualified', 'scheduled', 'in_preparation', 'in_progress', 'blocked', 'recovery']
    const activeBookingStatuses = ['registered', 'awaiting_customer', 'awaiting_angelcare', 'qualified', 'scheduled', 'in_preparation', 'in_progress']
    const openInvoiceStatuses = ['draft', 'issued', 'partially_paid', 'overdue']
    const openInquiryStatuses = ['new', 'triaged', 'in_progress']

    const [
      ordersCount,
      customersCount,
      bookingsCount,
      invoicesCount,
      approvalsCount,
      inquiriesCount,
      sanilaCount,
      blockedCount,
      recentOrders,
      recentCustomers,
      openInquiries,
      pendingApprovals,
      blockedActions,
    ] = await Promise.all([
      settle(db.from('angelcare_marketplace_journeys').select('id', { count: 'exact', head: true }).in('status', openJourneyStatuses)),
      settle(db.from('angelcare_marketplace_customer_accounts').select('id', { count: 'exact', head: true }).neq('status', 'archived')),
      settle(db.from('angelcare_marketplace_journeys').select('id', { count: 'exact', head: true }).in('journey_type', ['family_booking', 'recurring_service', 'academy_enrollment']).in('status', activeBookingStatuses)),
      settle(db.from('angelcare_marketplace_finance_invoices').select('id', { count: 'exact', head: true }).in('status', openInvoiceStatuses)),
      settle(db.from('angelcare_marketplace_approval_requests').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'in_review'])),
      settle(db.from('angelcare_marketplace_public_inquiries').select('id', { count: 'exact', head: true }).in('status', openInquiryStatuses)),
      settle(db.from('angelcare_marketplace_public_inquiries').select('id', { count: 'exact', head: true }).in('status', openInquiryStatuses).like('source_route', '%/sanila/%')),
      settle(db.from('angelcare_marketplace_admin_action_items').select('id', { count: 'exact', head: true }).eq('status', 'blocked')),
      settle(db.from('angelcare_marketplace_journeys').select('id,public_reference,title,status,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(5)),
      settle(db.from('angelcare_marketplace_customer_accounts').select('id,public_reference,display_name,status,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(5)),
      settle(db.from('angelcare_marketplace_public_inquiries').select('id,public_reference,full_name,organization,status,source_route,created_at').in('status', openInquiryStatuses).order('created_at', { ascending: false }).limit(8)),
      settle(db.from('angelcare_marketplace_approval_requests').select('id,title,priority,status,created_at').in('status', ['submitted', 'in_review']).order('created_at', { ascending: false }).limit(5)),
      settle(db.from('angelcare_marketplace_admin_action_items').select('id,title,priority,status,blocker,created_at').eq('status', 'blocked').order('created_at', { ascending: false }).limit(5)),
    ])

    const count = (result: QueryResult) => Number(result.count || 0)
    const indicators: AdminShellIndicator[] = [
      { key: 'orders', label: 'Commandes ouvertes', value: String(count(ordersCount)), hint: 'journeys à exécuter', href: '/angelcare-marketplace/admin/orders', category: 'commercial', tone: count(ordersCount) ? 'attention' : 'positive' },
      { key: 'customers', label: 'Clients', value: String(count(customersCount)), hint: 'dossiers actifs', href: '/angelcare-marketplace/admin/customers', category: 'commercial', tone: 'neutral' },
      { key: 'bookings', label: 'Bookings actifs', value: String(count(bookingsCount)), hint: 'services à opérer', href: '/angelcare-marketplace/admin/bookings', category: 'commercial', tone: count(bookingsCount) ? 'attention' : 'neutral' },
      { key: 'invoices', label: 'Factures ouvertes', value: String(count(invoicesCount)), hint: 'finance à suivre', href: '/angelcare-marketplace/admin/finance/invoices', category: 'commercial', tone: count(invoicesCount) ? 'attention' : 'positive' },
      { key: 'approvals', label: 'Décisions en attente', value: String(count(approvalsCount)), hint: 'approbations', href: '/angelcare-marketplace/admin/approvals', category: 'control', tone: count(approvalsCount) ? 'attention' : 'positive' },
      { key: 'inquiries', label: 'Demandes publiques', value: String(count(inquiriesCount)), hint: 'qualification requise', href: '/angelcare-marketplace/admin/public-inquiries', category: 'control', tone: count(inquiriesCount) ? 'attention' : 'positive' },
      { key: 'sanila', label: 'Démos SANILA', value: String(count(sanilaCount)), hint: 'demandes live', href: '/angelcare-marketplace/admin/sanila/requests', category: 'control', tone: count(sanilaCount) ? 'critical' : 'positive' },
      { key: 'blocked', label: 'Actions bloquées', value: String(count(blockedCount)), hint: 'déblocage opérateur', href: '/angelcare-marketplace/admin/action-center?status=blocked', category: 'control', tone: count(blockedCount) ? 'critical' : 'positive' },
    ]

    const notifications: AdminShellNotification[] = []

    for (const row of rows(recentOrders.data)) {
      const id = text(row.id)
      notifications.push({
        id: `order-${id}`,
        kind: 'order',
        title: text(row.title) || 'Nouvelle commande',
        detail: `${text(row.public_reference) || 'Commande'} · ${text(row.status) || 'nouvelle'} · ${displayTime(row.created_at)}`,
        href: id ? `/angelcare-marketplace/admin/orders/${id}` : '/angelcare-marketplace/admin/orders',
        createdAt: text(row.created_at) || generatedAt,
        severity: 'info',
      })
    }

    for (const row of rows(recentCustomers.data)) {
      const id = text(row.id)
      notifications.push({
        id: `customer-${id}`,
        kind: 'customer',
        title: text(row.display_name) || 'Nouveau client',
        detail: `${text(row.public_reference) || 'Client'} · inscription récente · ${displayTime(row.created_at)}`,
        href: id ? `/angelcare-marketplace/admin/customers/${id}` : '/angelcare-marketplace/admin/customers',
        createdAt: text(row.created_at) || generatedAt,
        severity: 'positive',
      })
    }

    for (const row of rows(openInquiries.data)) {
      const sourceRoute = text(row.source_route)
      const sanila = sourceRoute.includes('/sanila/')
      notifications.push({
        id: `inquiry-${text(row.id)}`,
        kind: sanila ? 'sanila' : 'inquiry',
        title: sanila ? 'Nouvelle demande de démo SANILA' : 'Demande publique à qualifier',
        detail: `${text(row.organization) || text(row.full_name) || text(row.public_reference) || 'Prospect'} · ${text(row.status) || 'ouverte'} · ${displayTime(row.created_at)}`,
        href: sanila ? '/angelcare-marketplace/admin/sanila/requests' : '/angelcare-marketplace/admin/public-inquiries',
        createdAt: text(row.created_at) || generatedAt,
        severity: sanila ? 'attention' : 'info',
      })
    }

    for (const row of rows(pendingApprovals.data)) {
      notifications.push({
        id: `approval-${text(row.id)}`,
        kind: 'approval',
        title: text(row.title) || 'Décision en attente',
        detail: `${text(row.priority) || 'normal'} · ${text(row.status) || 'soumise'} · ${displayTime(row.created_at)}`,
        href: '/angelcare-marketplace/admin/approvals',
        createdAt: text(row.created_at) || generatedAt,
        severity: 'attention',
      })
    }

    for (const row of rows(blockedActions.data)) {
      notifications.push({
        id: `blocker-${text(row.id)}`,
        kind: 'blocker',
        title: text(row.title) || 'Action bloquée',
        detail: `${text(row.blocker) || 'Blocage à traiter'} · ${displayTime(row.created_at)}`,
        href: '/angelcare-marketplace/admin/action-center?status=blocked',
        createdAt: text(row.created_at) || generatedAt,
        severity: 'critical',
      })
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const visibleNotifications = notifications.slice(0, 24)

    return {
      generatedAt,
      indicators,
      notifications: visibleNotifications,
      notificationCount: visibleNotifications.length,
    }
  } catch {
    return {
      generatedAt,
      indicators: [
        { key: 'snapshot', label: 'Snapshot Admin', value: '—', hint: 'indicateurs indisponibles', href: '/angelcare-marketplace/admin', category: 'control', tone: 'neutral' },
      ],
      notifications: [],
      notificationCount: 0,
    }
  }
}
