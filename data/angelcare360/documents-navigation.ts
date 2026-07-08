import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360DocumentsNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_DOCUMENTS_NAVIGATION: Angelcare360DocumentsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/documents',
    summary: 'Cockpit documents, gouvernance et stockage.',
    permission: 'documents.view',
    badge: 'Hub',
  },
  {
    key: 'generated',
    label: 'Documents générés',
    href: '/angelcare-360-command-center/documents/generated',
    summary: 'Documents réellement générés et historisés.',
    permission: 'documents.view',
  },
  {
    key: 'templates',
    label: 'Templates',
    href: '/angelcare-360-command-center/documents/templates',
    summary: 'Templates documentaires contrôlés.',
    permission: 'documents.view',
  },
  {
    key: 'governance',
    label: 'Gouvernance',
    href: '/angelcare-360-command-center/documents/governance',
    summary: 'Règles de gouvernance, stockage et rétention.',
    permission: 'documents.view',
  },
  {
    key: 'audit',
    label: 'Audit documents',
    href: '/angelcare-360-command-center/documents/audit',
    summary: 'Journal des mutations et blocages documentaires.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]
