export type Angelcare360TransportNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_TRANSPORT_NAVIGATION: Angelcare360TransportNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/transport',
    summary: 'Cockpit transport, risques, sécurité et verrouillages.',
    permission: 'transport.view',
    badge: 'Hub',
  },
  {
    key: 'routes',
    label: 'Circuits',
    href: '/angelcare-360-command-center/transport/circuits',
    summary: 'Circuits, véhicules, chauffeurs et accompagnateurs.',
    permission: 'transport.view',
  },
  {
    key: 'stops',
    label: 'Arrêts',
    href: '/angelcare-360-command-center/transport/arrets',
    summary: 'Arrêts, ordres de passage et horaires prévus.',
    permission: 'transport.view',
  },
  {
    key: 'vehicles',
    label: 'Véhicules',
    href: '/angelcare-360-command-center/transport/vehicules',
    summary: 'Bus, capacité, plaque et état opérationnel.',
    permission: 'transport.view',
  },
  {
    key: 'assignments',
    label: 'Affectations élèves',
    href: '/angelcare-360-command-center/transport/affectations',
    summary: 'Élèves affectés aux circuits, arrêts et véhicules.',
    permission: 'transport.view',
  },
  {
    key: 'pickup',
    label: 'Ramassage',
    href: '/angelcare-360-command-center/transport/ramassage',
    summary: 'Listes de ramassage et couverture des contacts.',
    permission: 'transport.view',
  },
  {
    key: 'dropoff',
    label: 'Dépôt',
    href: '/angelcare-360-command-center/transport/depot',
    summary: 'Listes de dépôt et signalisation des sorties.',
    permission: 'transport.view',
  },
  {
    key: 'safety',
    label: 'Sécurité',
    href: '/angelcare-360-command-center/transport/securite',
    summary: 'Capacité, chauffeurs, arrêts et blocages techniques.',
    permission: 'transport.view',
  },
  {
    key: 'incidents',
    label: 'Incidents',
    href: '/angelcare-360-command-center/transport/incidents',
    summary: 'Incident readiness et verrouillage si le socle n’existe pas.',
    permission: 'transport.view',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/angelcare-360-command-center/transport/notifications',
    summary: 'Préparation des notifications parents, verrouillée sans messagerie.',
    permission: 'transport.view',
  },
  {
    key: 'audit',
    label: 'Audit transport',
    href: '/angelcare-360-command-center/transport/audit',
    summary: 'Journal des mutations et blocages transport.',
    permission: 'audit.view',
    badge: 'Audit',
  },
]

