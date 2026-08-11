import type { AcWhatsAppPermission } from './types'

export const AC_WHATSAPP_PERMISSIONS: ReadonlyArray<{ key: AcWhatsAppPermission; label: string; group: string }> = [
  { key: 'ac-whatsapp.view', label: 'Accès AC WhatsApp Live', group: 'Module' },
  { key: 'ac-whatsapp.inbox.view', label: 'Voir le Live Command', group: 'Conversations' },
  { key: 'ac-whatsapp.message.send', label: 'Envoyer des messages', group: 'Conversations' },
  { key: 'ac-whatsapp.message.delete', label: 'Supprimer ou révoquer des messages', group: 'Conversations' },
  { key: 'ac-whatsapp.conversation.assign', label: 'Assigner et transférer', group: 'Conversations' },
  { key: 'ac-whatsapp.conversation.close', label: 'Résoudre et clôturer', group: 'Conversations' },
  { key: 'ac-whatsapp.contact.manage', label: 'Gérer contacts et intelligence', group: 'Contacts' },
  { key: 'ac-whatsapp.campaign.view', label: 'Voir les campagnes', group: 'Commercial' },
  { key: 'ac-whatsapp.campaign.manage', label: 'Créer et modifier les campagnes', group: 'Commercial' },
  { key: 'ac-whatsapp.campaign.launch', label: 'Lancer, suspendre et annuler', group: 'Commercial' },
  { key: 'ac-whatsapp.account.manage', label: 'Administrer comptes et sessions', group: 'Administration' },
  { key: 'ac-whatsapp.members.manage', label: 'Administrer équipes et accès', group: 'Administration' },
  { key: 'ac-whatsapp.team.remove', label: 'Retirer un membre d’AC WhatsApp', group: 'Administration' },
  { key: 'ac-whatsapp.templates.manage', label: 'Administrer les modèles (compatibilité)', group: 'Réponses' },
  { key: 'ac-whatsapp.responses.manage', label: 'Administrer catégories et réponses', group: 'Réponses' },
  { key: 'ac-whatsapp.responses.import', label: 'Importer des réponses CSV', group: 'Réponses' },
  { key: 'ac-whatsapp.responses.publish', label: 'Approuver et publier les réponses', group: 'Réponses' },
  { key: 'ac-whatsapp.automation.manage', label: 'Administrer les automatisations', group: 'Automatisation' },
  { key: 'ac-whatsapp.storage.view', label: 'Voir le Media Vault', group: 'Stockage' },
  { key: 'ac-whatsapp.storage.manage', label: 'Gérer la rétention Media Vault', group: 'Stockage' },
  { key: 'ac-whatsapp.storage.purge', label: 'Purger des médias du serveur', group: 'Stockage' },
  { key: 'ac-whatsapp.analytics.view', label: 'Voir les analyses', group: 'Direction' },
  { key: 'ac-whatsapp.quality.review', label: 'Contrôle qualité et coaching', group: 'Qualité' },
  { key: 'ac-whatsapp.security.manage', label: 'Sécurité et incidents', group: 'Sécurité' },
  { key: 'ac-whatsapp.audit.view', label: 'Voir les preuves d’audit', group: 'Sécurité' },
]

const ALL = AC_WHATSAPP_PERMISSIONS.map(x => x.key)
const READ: AcWhatsAppPermission[] = ['ac-whatsapp.view','ac-whatsapp.inbox.view','ac-whatsapp.campaign.view']
const SEND: AcWhatsAppPermission[] = [...READ,'ac-whatsapp.message.send']
const RESPONSES: AcWhatsAppPermission[] = ['ac-whatsapp.responses.manage','ac-whatsapp.responses.import','ac-whatsapp.responses.publish','ac-whatsapp.templates.manage']

export const AC_WHATSAPP_ROLE_DEFAULTS: Record<string, AcWhatsAppPermission[]> = {
  platform_administrator: ALL,
  whatsapp_director: ALL,
  account_administrator: ALL,
  department_supervisor: [...SEND,'ac-whatsapp.conversation.assign','ac-whatsapp.conversation.close','ac-whatsapp.contact.manage','ac-whatsapp.campaign.manage','ac-whatsapp.campaign.launch','ac-whatsapp.members.manage','ac-whatsapp.team.remove',...RESPONSES,'ac-whatsapp.automation.manage','ac-whatsapp.storage.view','ac-whatsapp.storage.manage','ac-whatsapp.analytics.view','ac-whatsapp.quality.review','ac-whatsapp.audit.view'],
  campaign_manager: [...READ,'ac-whatsapp.contact.manage','ac-whatsapp.campaign.manage','ac-whatsapp.campaign.launch',...RESPONSES,'ac-whatsapp.automation.manage','ac-whatsapp.analytics.view'],
  team_leader: [...SEND,'ac-whatsapp.conversation.assign','ac-whatsapp.conversation.close','ac-whatsapp.contact.manage','ac-whatsapp.campaign.view','ac-whatsapp.responses.manage','ac-whatsapp.templates.manage','ac-whatsapp.analytics.view','ac-whatsapp.quality.review'],
  senior_operator: [...SEND,'ac-whatsapp.conversation.assign','ac-whatsapp.conversation.close','ac-whatsapp.contact.manage','ac-whatsapp.campaign.view'],
  operator: [...SEND,'ac-whatsapp.conversation.close','ac-whatsapp.campaign.view'],
  quality_controller: [...READ,'ac-whatsapp.analytics.view','ac-whatsapp.quality.review','ac-whatsapp.audit.view'],
  analyst: [...READ,'ac-whatsapp.analytics.view','ac-whatsapp.audit.view'],
  auditor: ['ac-whatsapp.view','ac-whatsapp.analytics.view','ac-whatsapp.audit.view','ac-whatsapp.storage.view'],
  read_only_observer: READ,
}

const privilegedRoles = new Set(['ceo','owner','direction','admin','super_admin','root','root_admin'])
const globallyScopedMembershipRoles = new Set(['platform_administrator','whatsapp_director','account_administrator'])
const broadConversationRoles = new Set(['platform_administrator','whatsapp_director','account_administrator','department_supervisor','team_leader','quality_controller','analyst','auditor'])

export function normalizeRole(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

export function isAcWhatsAppPrivilegedUser(user: any) {
  return privilegedRoles.has(normalizeRole(user?.role ?? user?.role_key))
}

export function isAcWhatsAppGlobalMembership(role: unknown) {
  return globallyScopedMembershipRoles.has(normalizeRole(role))
}

export function hasBroadConversationScope(role: unknown) {
  return broadConversationRoles.has(normalizeRole(role))
}

export function userPermissions(user: any): string[] {
  return Array.isArray(user?.permissions) ? user.permissions.map(String) : []
}

export function effectiveAcWhatsAppPermissions(user: any, membership?: any): string[] {
  if (isAcWhatsAppPrivilegedUser(user)) return ALL
  const roleDefaults = AC_WHATSAPP_ROLE_DEFAULTS[normalizeRole(membership?.role_key)] || []
  const explicit = Array.isArray(membership?.permissions) ? membership.permissions.map(String) : []
  return [...new Set([...userPermissions(user), ...roleDefaults, ...explicit])]
}

export function hasAcWhatsAppPermission(user: any, membership: any, required: AcWhatsAppPermission | AcWhatsAppPermission[]) {
  if (!user) return false
  if (isAcWhatsAppPrivilegedUser(user)) return true
  if (!membership || membership.status !== 'active') return false
  const permissions = effectiveAcWhatsAppPermissions(user, membership)
  if (permissions.includes('*') || permissions.includes('ac-whatsapp.*')) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every(key => permissions.includes(key))
}
