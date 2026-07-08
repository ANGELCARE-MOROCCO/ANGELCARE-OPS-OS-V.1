import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360NotificationsNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_NOTIFICATIONS_NAVIGATION: Angelcare360NotificationsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/notifications',
    summary: 'Cockpit notifications et état des canaux.',
    permission: 'notifications.view',
    badge: 'Hub',
  },
  {
    key: 'internes',
    label: 'Notifications internes',
    href: '/angelcare-360-command-center/notifications/internes',
    summary: 'Notifications internes persistées et lues.',
    permission: 'notifications.view',
  },
  {
    key: 'canaux',
    label: 'Canaux',
    href: '/angelcare-360-command-center/notifications/canaux',
    summary: 'Email, SMS, WhatsApp et push verrouillés.',
    permission: 'notifications.view',
  },
  {
    key: 'historique',
    label: 'Historique',
    href: '/angelcare-360-command-center/notifications/historique',
    summary: 'Historique des notifications internes.',
    permission: 'notifications.view',
  },
  {
    key: 'audit',
    label: 'Audit notifications',
    href: '/angelcare-360-command-center/notifications/audit',
    summary: 'Journal des mutations et blocages notifications.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]

