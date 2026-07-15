export type CsaPriority = 'critical' | 'high' | 'medium' | 'stable'
export type CsaStatus = 'active' | 'waiting' | 'late' | 'resolved'

export const csaKpis = [
  { label: 'Families under care', value: '184', trend: '+18%', signal: 'healthy', detail: 'Active family accounts monitored today' },
  { label: 'Leads to recover', value: '37', trend: '+9', signal: 'warning', detail: 'Leads needing call or WhatsApp follow-up' },
  { label: 'Service activations', value: '22', trend: '+6', signal: 'healthy', detail: 'Services ready to launch or confirm' },
  { label: 'Revenue at risk', value: '41.8K MAD', trend: '-12%', signal: 'critical', detail: 'Potential revenue needing CSA recovery action' },
  { label: 'Family satisfaction', value: '91%', trend: '+4%', signal: 'healthy', detail: 'Aggregated service sentiment and issue closure quality' },
  { label: 'Pending escalations', value: '11', trend: '+3', signal: 'warning', detail: 'Operational, service or billing issues needing closure' },
]

export const csaWorkstreams = [
  {
    title: 'Lead Follow-up Control',
    href: '/leads',
    module: 'Leads',
    description: 'Recover warm prospects, call back parents, qualify needs, and handoff sales-ready opportunities.',
    priority: 'critical',
    metrics: ['37 open callbacks', '14 WhatsApp pending', '8 hot families'],
  },
  {
    title: 'Family Experience Timeline',
    href: '/families',
    module: 'Families',
    description: 'Monitor family history, service satisfaction, incidents, notes, renewals and retention signals.',
    priority: 'high',
    metrics: ['184 families', '17 risk signals', '29 follow-ups'],
  },
  {
    title: 'Service Activation Desk',
    href: '/services',
    module: 'Services',
    description: 'Prepare service launch, confirm requirements, coordinate expectations and detect activation blockers.',
    priority: 'high',
    metrics: ['22 activations', '9 missing info', '6 ready today'],
  },
  {
    title: 'Revenue Recovery Board',
    href: '/revenue-command-center',
    module: 'Revenue',
    description: 'Protect revenue by resolving blocked deals, unpaid invoices, hesitation signals and delayed decisions.',
    priority: 'critical',
    metrics: ['41.8K MAD risk', '12 late actions', '5 urgent saves'],
  },
  {
    title: 'Sales Synchronization',
    href: '/sales',
    module: 'Sales',
    description: 'Keep sales context synchronized with family needs, lead status, objections and next best action.',
    priority: 'medium',
    metrics: ['28 active deals', '16 proposal follow-ups', '7 objections'],
  },
  {
    title: 'Quality & Escalations',
    href: '/incidents',
    module: 'Quality',
    description: 'Track complaints, urgent service problems, family concerns and internal resolution ownership.',
    priority: 'high',
    metrics: ['11 escalations', '4 unresolved', '3 critical'],
  },
]

export const csaActionQueue = [
  { family: 'Famille Benali', type: 'Service launch', source: 'Services', priority: 'critical', due: 'Today 11:00', action: 'Confirm nanny profile and start conditions' },
  { family: 'Famille El Mansouri', type: 'Revenue recovery', source: 'Revenue', priority: 'critical', due: 'Today 12:30', action: 'Call after proposal hesitation' },
  { family: 'Crèche Les Petits Génies', type: 'B2B lead', source: 'Leads', priority: 'high', due: 'Today 14:00', action: 'Send partnership follow-up and schedule visit' },
  { family: 'Famille Idrissi', type: 'Complaint', source: 'Families', priority: 'high', due: 'Today 16:00', action: 'Close satisfaction incident and log outcome' },
  { family: 'Famille Alaoui', type: 'Upsell', source: 'Sales', priority: 'medium', due: 'Tomorrow', action: 'Propose service extension package' },
]

export const csaSignals = [
  { title: 'Revenue delay detected', detail: '5 families have proposal delays over 48h with strong initial interest.', severity: 'critical' },
  { title: 'High service demand in Rabat', detail: 'Childcare and emergency support requests increased this week.', severity: 'high' },
  { title: 'Complaint recovery opportunity', detail: '3 families with negative sentiment can be recovered with manager call.', severity: 'high' },
  { title: 'Lead quality spike', detail: 'Campaign leads from preschools show stronger conversion intent.', severity: 'medium' },
]

export const csaModuleSync = [
  { module: 'Revenue Management', status: 'Synced', href: '/revenue-command-center', health: 92 },
  { module: 'Services', status: 'Activation Ready', href: '/services', health: 88 },
  { module: 'Sales', status: 'Pipeline Active', href: '/sales', health: 84 },
  { module: 'Leads', status: 'Follow-up Required', href: '/leads', health: 76 },
  { module: 'Families', status: 'Experience Live', href: '/families', health: 90 },
]
