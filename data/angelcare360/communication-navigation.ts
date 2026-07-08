import type { Angelcare360ModuleNavigationItem } from '@/types/angelcare360/module'

export type Angelcare360CommunicationNavigationItem = Angelcare360ModuleNavigationItem

export const ANGELCARE360_COMMUNICATION_NAVIGATION: Angelcare360CommunicationNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/messagerie',
    summary: 'Cockpit communication, risques et verrouillages.',
    permission: 'messagerie.view',
    badge: 'Hub',
  },
  {
    key: 'conversations',
    label: 'Conversations',
    href: '/angelcare-360-command-center/messagerie/conversations',
    summary: 'Messages internes et échanges opérationnels.',
    permission: 'messagerie.view',
  },
  {
    key: 'annonces',
    label: 'Annonces',
    href: '/angelcare-360-command-center/messagerie/annonces',
    summary: 'Annonces internes et audiences.',
    permission: 'messagerie.view',
  },
  {
    key: 'modeles',
    label: 'Modèles',
    href: '/angelcare-360-command-center/messagerie/modeles',
    summary: 'Modèles de messages et contenus réutilisables.',
    permission: 'messagerie.view',
  },
  {
    key: 'audiences',
    label: 'Audiences',
    href: '/angelcare-360-command-center/messagerie/audiences',
    summary: 'Préparation des audiences et couverture.',
    permission: 'messagerie.view',
  },
  {
    key: 'audit',
    label: 'Audit messagerie',
    href: '/angelcare-360-command-center/messagerie/audit',
    summary: 'Journal des mutations et blocages communication.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]

