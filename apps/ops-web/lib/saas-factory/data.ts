import type { FactoryModule, FactoryOptionGroup } from './types'

export type FactoryModuleSeed = FactoryModule & {
  route: string
  icon: string
  health: number
  access: string
  environment: string
  version: string
  apiCount: number
  pageCount: number
  tables: string[]
  dependencies: string[]
  rollout: string
  owner: string
}

export type FactoryOptionGroupSeed = FactoryOptionGroup & {
  type: string
  options: number
  modules: number
  usage30d: number
  status: string
  lastUpdated: string
}

export type FactoryActionSeed = {
  id: string
  label: string
  type: string
  module: string
  path: string
  connectedApi: string
  method: string
  status: string
  responseTime?: number
  error?: string
  lastTested: string
}

export type FactoryIncidentSeed = {
  id: string
  title: string
  severity: string
  service: string
  region: string
  status: string
  duration: string
  createdAt: string
}

export type FeatureFlagSeed = {
  key: string
  description: string
  enabled: boolean
  type: string
  environments: string[]
  target: string
  owner: string
  impact: number
  risk: string
}

export type QueueRecordSeed = {
  key: string
  label: string
  type: string
  status: string
  messages: number
  backlog: number
  inFlight: number
  failed: number
  avgMs: number
}

export type TenantRecordSeed = {
  key: string
  name: string
  domain: string
  status: string
  plan: string
  region: string
  users: number
  ingestionGb: number
  createdOn: string
}

export type DataSourceRecordSeed = {
  key: string
  label: string
  type: string
  category: string
  status: string
  ingestionHealth: number
  owner: string
  usage: string
  lastIngested: string
}

export type AuditEventSeed = {
  id: string
  time: string
  event: string
  user: string
  resource: string
  type: string
  severity: string
  result: string
  ip: string
}

export const factoryPages = [
  { key: 'overview', label: 'Executive Overview', href: '/saas-factory-command', icon: 'LayoutDashboard', subtitle: 'Real-time operational overview' },
  { key: 'observatory', label: 'Live System Observatory', href: '/saas-factory-command/observatory', icon: 'Activity', subtitle: 'System health and probes' },
  { key: 'modules', label: 'Module Registry', href: '/saas-factory-command/modules', icon: 'Boxes', subtitle: 'Module exposure control' },
  { key: 'configuration', label: 'Configuration Factory', href: '/saas-factory-command/configuration', icon: 'Factory', subtitle: 'Live business config' },
  { key: 'options', label: 'Options Registry', href: '/saas-factory-command/options', icon: 'ListChecks', subtitle: 'Global option source' },
  { key: 'actions', label: 'Action Liveness Matrix', href: '/saas-factory-command/actions', icon: 'MousePointerClick', subtitle: 'Button/API coverage' },
  { key: 'apis', label: 'API Command Center', href: '/saas-factory-command/apis', icon: 'Cable', subtitle: 'Route health and testing' },
  { key: 'supabase', label: 'Supabase Infrastructure', href: '/saas-factory-command/supabase', icon: 'Database', subtitle: 'Database control' },
  { key: 'realtime', label: 'Realtime & Notifications', href: '/saas-factory-command/realtime', icon: 'RadioTower', subtitle: 'Channels and alerts' },
  { key: 'incidents', label: 'Incident Command Center', href: '/saas-factory-command/incidents', icon: 'ShieldAlert', subtitle: 'Response operations' },
  { key: 'permissions', label: 'Permission Matrix', href: '/saas-factory-command/permissions', icon: 'ShieldCheck', subtitle: 'Roles and actions' },
  { key: 'feature-flags', label: 'Feature Flags Lab', href: '/saas-factory-command/feature-flags', icon: 'Flag', subtitle: 'Rollouts and releases' },
  { key: 'rules', label: 'Rule Builder Engine', href: '/saas-factory-command/rules', icon: 'Workflow', subtitle: 'Trigger condition actions' },
  { key: 'data-sources', label: 'Data Source Truth Center', href: '/saas-factory-command/data-sources', icon: 'DatabaseZap', subtitle: 'Source of truth inventory' },
  { key: 'queues', label: 'Queue & Sync Center', href: '/saas-factory-command/queues', icon: 'ServerCog', subtitle: 'Processing queues' },
  { key: 'tenants', label: 'Tenant & Environment', href: '/saas-factory-command/tenants', icon: 'Building2', subtitle: 'SaaS tenant control' },
  { key: 'deployment', label: 'Deployment Readiness', href: '/saas-factory-command/deployment', icon: 'Rocket', subtitle: 'Release validation' },
  { key: 'audit', label: 'Audit Timeline', href: '/saas-factory-command/audit', icon: 'ScrollText', subtitle: 'Configuration history' },
] as const

export const modules: FactoryModuleSeed[] = [
  { key: 'email_os', label: 'Email OS', description: 'Enterprise email operations', route: '/email-os', icon: 'Mail', status: 'healthy', health: 99.8, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 140, pageCount: 36, tables: ['email_os_messages','email_os_mailboxes','email_os_outbox_queue'], dependencies: ['Supabase','SMTP','POP/IMAP','Templates'], rollout: 'released', owner: 'Engineering' },
  { key: 'revenue', label: 'Revenue Command', description: 'Revenue and financial operations', route: '/revenue-command-center', icon: 'Landmark', status: 'healthy', health: 99.6, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 50, pageCount: 152, tables: ['revenue_tasks','prospects','partners','activities'], dependencies: ['Supabase','Persistence Bridge'], rollout: 'released', owner: 'Revenue Ops' },
  { key: 'hr', label: 'HR OS', description: 'Human resources system', route: '/hr', icon: 'Users', status: 'healthy', health: 99.5, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 26, pageCount: 117, tables: ['hr_employees','hr_attendance','hr_rosters'], dependencies: ['Supabase','Realtime'], rollout: 'released', owner: 'HR Ops' },
  { key: 'academy', label: 'Academy OS', description: 'Learning and academy system', route: '/academy', icon: 'GraduationCap', status: 'healthy', health: 99.7, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 9, pageCount: 56, tables: ['academy_trainees','academy_courses','academy_documents'], dependencies: ['Supabase','QR','Documents'], rollout: 'rolling_out', owner: 'Academy Ops' },
  { key: 'market', label: 'Market OS', description: 'Marketing and campaign system', route: '/market-os', icon: 'Megaphone', status: 'healthy', health: 99.4, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 48, pageCount: 141, tables: ['market_os_campaigns','market_content_assets'], dependencies: ['Supabase','Content Engine'], rollout: 'rolling_out', owner: 'Marketing' },
  { key: 'connect', label: 'Connect OS', description: 'Messaging and collaboration', route: '/connect', icon: 'Network', status: 'healthy', health: 99.9, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 11, pageCount: 8, tables: ['connect_rooms','connect_messages','connect_tasks'], dependencies: ['Supabase','LiveKit','Notifications'], rollout: 'released', owner: 'Operations' },
  { key: 'service_os', label: 'Service OS', description: 'Service management', route: '/service-os', icon: 'BriefcaseBusiness', status: 'healthy', health: 98.9, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 12, pageCount: 27, tables: ['serviceos_blueprints','serviceos_executions'], dependencies: ['Supabase','Rules'], rollout: 'released', owner: 'Service Ops' },
  { key: 'shopify', label: 'Shopify OS', description: 'Ecommerce integration', route: '/shopify', icon: 'ShoppingBag', status: 'warning', health: 95.2, visibility: 'hidden', access: 'restricted', environment: 'production', version: 'v2.6.0', apiCount: 8, pageCount: 4, tables: ['shopify_sessions'], dependencies: ['Shopify API'], rollout: 'maintenance', owner: 'Integrations' },
  { key: 'voice', label: 'Voice Center', description: 'Voice and phone system', route: '/voice', icon: 'PhoneCall', status: 'maintenance', health: 95.2, visibility: 'hidden', access: 'none', environment: 'maintenance', version: 'v2.6.0', apiCount: 6, pageCount: 2, tables: ['voice_calls'], dependencies: ['Telnyx','LiveKit'], rollout: 'maintenance', owner: 'Engineering' },
  { key: 'reports', label: 'Reports OS', description: 'Analytics and reports', route: '/reports', icon: 'BarChart3', status: 'healthy', health: 99.1, visibility: 'visible', access: 'full', environment: 'production', version: 'v2.6.0', apiCount: 10, pageCount: 12, tables: ['reports_exports'], dependencies: ['Supabase'], rollout: 'released', owner: 'Analytics' },
]

export const optionGroups: FactoryOptionGroupSeed[] = [
  { key: 'cities', label: 'Cities', description: 'All system cities and locations', type: 'system', options: 156, modules: 9, usage30d: 12842, status: 'healthy', lastUpdated: '2m ago' },
  { key: 'regions', label: 'Regions', description: 'Geographic regions', type: 'system', options: 48, modules: 8, usage30d: 8573, status: 'healthy', lastUpdated: '11m ago' },
  { key: 'service_categories', label: 'Service Categories', description: 'All service categories', type: 'business', options: 72, modules: 7, usage30d: 6231, status: 'healthy', lastUpdated: '15m ago' },
  { key: 'hr_departments', label: 'Departments', description: 'HR departments', type: 'business', options: 34, modules: 5, usage30d: 4289, status: 'healthy', lastUpdated: '30m ago' },
  { key: 'hr_positions', label: 'Positions', description: 'Job positions', type: 'business', options: 67, modules: 5, usage30d: 3928, status: 'healthy', lastUpdated: '28m ago' },
  { key: 'academy_groups', label: 'Academy Groups', description: 'Academy group categories', type: 'business', options: 26, modules: 4, usage30d: 2971, status: 'healthy', lastUpdated: '25m ago' },
  { key: 'lead_sources', label: 'Lead Sources', description: 'Lead acquisition sources', type: 'business', options: 19, modules: 6, usage30d: 5321, status: 'healthy', lastUpdated: '45m ago' },
  { key: 'prospect_statuses', label: 'Prospect Statuses', description: 'Prospect lifecycle states', type: 'business', options: 12, modules: 5, usage30d: 3142, status: 'healthy', lastUpdated: '1h ago' },
  { key: 'partner_types', label: 'Partner Types', description: 'Partner classifications', type: 'business', options: 17, modules: 3, usage30d: 1983, status: 'healthy', lastUpdated: '2h ago' },
  { key: 'payment_statuses', label: 'Payment Statuses', description: 'Payment and invoice status', type: 'system', options: 11, modules: 5, usage30d: 2173, status: 'healthy', lastUpdated: '1h ago' },
  { key: 'task_priorities', label: 'Task Priorities', description: 'Task priority levels', type: 'system', options: 5, modules: 8, usage30d: 4671, status: 'healthy', lastUpdated: '3h ago' },
  { key: 'notification_channels', label: 'Notification Channels', description: 'Notification delivery channels', type: 'system', options: 9, modules: 7, usage30d: 6842, status: 'healthy', lastUpdated: '2h ago' },
  { key: 'document_templates', label: 'Document Templates', description: 'Document and file templates', type: 'custom', options: 31, modules: 6, usage30d: 2654, status: 'healthy', lastUpdated: '4h ago' },
  { key: 'email_templates', label: 'Email Templates', description: 'System email templates', type: 'custom', options: 42, modules: 6, usage30d: 3291, status: 'healthy', lastUpdated: '4h ago' },
  { key: 'work_shift_types', label: 'Work Shifts', description: 'Work schedule shift types', type: 'business', options: 8, modules: 4, usage30d: 1782, status: 'healthy', lastUpdated: '5h ago' },
]

export const actions: FactoryActionSeed[] = [
  { id: 'a1', label: 'Save Lead Button', type: 'button', module: 'Leads', path: '/leads/create', connectedApi: '/api/leads', method: 'POST', status: 'live', responseTime: 128, lastTested: '2m ago' },
  { id: 'a2', label: 'Delete Prospect', type: 'button', module: 'Leads', path: '/leads/[id]', connectedApi: '/api/leads/[id]', method: 'DELETE', status: 'live', responseTime: 102, lastTested: '1m ago' },
  { id: 'a3', label: 'Send Email', type: 'button', module: 'Email OS', path: '/email-os/compose', connectedApi: '/api/email/send', method: 'POST', status: 'live', responseTime: 324, lastTested: '1m ago' },
  { id: 'a4', label: 'Preview Email', type: 'modal', module: 'Email OS', path: '/email-os/compose', connectedApi: '/api/email/preview', method: 'POST', status: 'live', responseTime: 98, lastTested: '2m ago' },
  { id: 'a5', label: 'Generate PDF', type: 'button', module: 'Revenue', path: '/invoices/[id]', connectedApi: '/api/invoices/[id]/pdf', method: 'GET', status: 'warning', responseTime: 2400, error: 'Slow response', lastTested: '2m ago' },
  { id: 'a6', label: 'Record Payment', type: 'button', module: 'Revenue', path: '/payments/create', connectedApi: '/api/payments', method: 'POST', status: 'live', responseTime: 112, lastTested: '1m ago' },
  { id: 'a7', label: 'Enroll Course', type: 'button', module: 'Academy', path: '/enrollments/create', connectedApi: '/api/enrollments', method: 'POST', status: 'warning', responseTime: 2100, error: 'Timeout risk', lastTested: '3m ago' },
  { id: 'a8', label: 'Upload Certificate', type: 'button', module: 'Academy', path: '/certificates/upload', connectedApi: '/api/certificates/upload', method: 'POST', status: 'dead', responseTime: 0, error: '500 Server Error', lastTested: '5m ago' },
  { id: 'a9', label: 'Create Room', type: 'modal', module: 'Connect', path: '/connect/rooms', connectedApi: '/api/connect/rooms', method: 'POST', status: 'live', responseTime: 215, lastTested: '2m ago' },
  { id: 'a10', label: 'Create Task', type: 'modal', module: 'Connect', path: '/connect/tasks', connectedApi: '/api/connect/tasks', method: 'POST', status: 'live', responseTime: 233, lastTested: '2m ago' },
]

export const incidents: FactoryIncidentSeed[] = [
  { id: 'INC-2025-019-007', title: 'Payment API Failure', severity: 'critical', service: 'Payment, DB', region: 'US-East', status: 'investigating', duration: '2h 34m', createdAt: '5m ago' },
  { id: 'INC-2025-019-006', title: 'Database Connection Pool Exhausted', severity: 'critical', service: 'Database', region: 'US-East', status: 'investigating', duration: '1h 47m', createdAt: '12m ago' },
  { id: 'INC-2025-019-005', title: 'High Error Rate API Gateway', severity: 'high', service: 'API Gateway', region: 'US-West', status: 'identified', duration: '1h 12m', createdAt: '18m ago' },
  { id: 'INC-2025-019-004', title: 'File Upload Service Degraded', severity: 'high', service: 'Storage', region: 'EU-West', status: 'monitoring', duration: '58m', createdAt: '25m ago' },
  { id: 'INC-2025-019-003', title: 'Slow Query Alert', severity: 'medium', service: 'Database', region: 'US-East', status: 'monitoring', duration: '37m', createdAt: '34m ago' },
  { id: 'INC-2025-019-001', title: 'Email Delivery Delays', severity: 'low', service: 'Email Service', region: 'US-East', status: 'resolved', duration: '18m', createdAt: '45m ago' },
]

export const featureFlags: FeatureFlagSeed[] = [
  { key: 'advanced-threat-hunting', description: 'Enable new advanced threat hunting UI', enabled: true, type: 'release', environments: ['Prod','Staging','Dev'], target: 'Security Team 50%', owner: 'Selma El Alami', impact: 62, risk: 'high' },
  { key: 'ai-assistant', description: 'AI-powered system advisor assistant', enabled: true, type: 'experiment', environments: ['Prod','Staging'], target: 'Beta testers 25%', owner: 'James Patel', impact: 18, risk: 'medium' },
  { key: 'auto-incident-correlation', description: 'Auto correlate related incidents', enabled: false, type: 'ops', environments: ['Staging','Dev'], target: 'All users 0%', owner: 'Priya Nair', impact: 0, risk: 'low' },
  { key: 'new-detection-engine', description: 'Next generation detection engine', enabled: true, type: 'release', environments: ['Prod'], target: 'All users 100%', owner: 'Alex Chen', impact: 100, risk: 'high' },
  { key: 'vuln-risk-scoring-v2', description: 'Improved vulnerability risk scoring', enabled: false, type: 'release', environments: ['Prod','Staging'], target: 'All users 100%', owner: 'Maya Rodriguez', impact: 0, risk: 'medium' },
  { key: 'dark-mode-ui', description: 'Dark mode for platform UI', enabled: true, type: 'release', environments: ['Prod','Staging','Dev'], target: 'All users 100%', owner: 'Rohan Das', impact: 85, risk: 'low' },
]

export const queues: QueueRecordSeed[] = [
  { key: 'alerts-processing-queue', label: 'alerts-processing-queue', type: 'standard', status: 'healthy', messages: 48732, backlog: 1245, inFlight: 2341, failed: 10, avgMs: 812 },
  { key: 'endpoint-events-queue', label: 'endpoint-events-queue', type: 'standard', status: 'healthy', messages: 96432, backlog: 120, inFlight: 4892, failed: 5, avgMs: 645 },
  { key: 'threat-intel-queue', label: 'threat-intel-queue', type: 'standard', status: 'healthy', messages: 25981, backlog: 0, inFlight: 1203, failed: 0, avgMs: 721 },
  { key: 'ml-analysis-queue', label: 'ml-analysis-queue', type: 'priority', status: 'warning', messages: 18642, backlog: 2456, inFlight: 798, failed: 7, avgMs: 2150 },
  { key: 'case-management-queue', label: 'case-management-queue', type: 'standard', status: 'healthy', messages: 12345, backlog: 0, inFlight: 456, failed: 0, avgMs: 512 },
  { key: 'email-notifications-queue', label: 'email-notifications-queue', type: 'standard', status: 'warning', messages: 8912, backlog: 1875, inFlight: 234, failed: 34, avgMs: 1420 },
  { key: 'audit-logs-queue', label: 'audit-logs-queue', type: 'standard', status: 'healthy', messages: 15673, backlog: 0, inFlight: 678, failed: 0, avgMs: 688 },
]

export const tenants: TenantRecordSeed[] = [
  { key: 'angelcare', name: 'Angelcare Technologies', domain: 'angelcare.com', status: 'active', plan: 'enterprise', region: 'US-East (N. Virginia)', users: 156, ingestionGb: 450.23, createdOn: 'Jan 15, 2024' },
  { key: 'global-secure', name: 'Global Secure Inc.', domain: 'globalsecure.com', status: 'active', plan: 'enterprise', region: 'US-West (Oregon)', users: 98, ingestionGb: 312.64, createdOn: 'Feb 3, 2024' },
  { key: 'secureapp', name: 'SecureApp Solutions', domain: 'secureapp.io', status: 'active', plan: 'professional', region: 'EU-West (Ireland)', users: 64, ingestionGb: 182.37, createdOn: 'Mar 10, 2024' },
  { key: 'defense', name: 'DefenseTech Corp', domain: 'defensetech.com', status: 'active', plan: 'enterprise', region: 'US-East (N. Virginia)', users: 211, ingestionGb: 678.91, createdOn: 'Dec 20, 2023' },
  { key: 'healthcare', name: 'HealthCare Plus', domain: 'healthcareplus.org', status: 'suspended', plan: 'professional', region: 'AP-Southeast (Singapore)', users: 32, ingestionGb: 24.18, createdOn: 'Apr 5, 2024' },
]

export const dataSources: DataSourceRecordSeed[] = [
  { key: 'supabase-core', label: 'Supabase Core Tables', type: 'supabase', category: 'Database', status: 'healthy', ingestionHealth: 99, owner: 'IT Team', usage: 'high', lastIngested: '2m ago' },
  { key: 'email-os-api', label: 'Email OS API Routes', type: 'api', category: 'Email', status: 'healthy', ingestionHealth: 98, owner: 'Email Team', usage: 'high', lastIngested: '30s ago' },
  { key: 'browser-persistence', label: 'Browser Persistence Bridge', type: 'local_storage', category: 'Recovery', status: 'warning', ingestionHealth: 72, owner: 'Revenue Ops', usage: 'medium', lastIngested: '10m ago' },
  { key: 'livekit', label: 'LiveKit Voice/Rooms', type: 'external', category: 'Realtime', status: 'healthy', ingestionHealth: 96, owner: 'Connect Team', usage: 'medium', lastIngested: '1m ago' },
  { key: 'static-sales-data', label: 'Sales Static Data', type: 'static', category: 'Legacy', status: 'critical', ingestionHealth: 15, owner: 'Sales Team', usage: 'low', lastIngested: 'unknown' },
  { key: 'supabase-realtime', label: 'Supabase Realtime Channels', type: 'realtime', category: 'Realtime', status: 'healthy', ingestionHealth: 100, owner: 'Engineering', usage: 'high', lastIngested: 'live' },
]

export const auditEvents: AuditEventSeed[] = [
  { id: 'evt_001', time: 'May 19, 2025 10:24:35 AM', event: 'User role updated', user: 'Selma El Alami', resource: 'John Smith', type: 'User Management', severity: 'medium', result: 'success', ip: '192.168.1.45' },
  { id: 'evt_002', time: 'May 19, 2025 10:22:11 AM', event: 'Policy updated', user: 'Selma El Alami', resource: 'Password Policy', type: 'Policy Change', severity: 'low', result: 'success', ip: '192.168.1.45' },
  { id: 'evt_003', time: 'May 19, 2025 10:18:47 AM', event: 'Detection rule modified', user: 'Alex Chen', resource: 'Suspicious PowerShell', type: 'Detection Rule', severity: 'high', result: 'success', ip: '10.0.0.23' },
  { id: 'evt_004', time: 'May 19, 2025 10:15:02 AM', event: 'Data source added', user: 'Priya Nair', resource: 'AWS CloudTrail', type: 'Data Source', severity: 'low', result: 'success', ip: '192.168.2.10' },
  { id: 'evt_005', time: 'May 19, 2025 10:10:33 AM', event: 'Permission changed', user: 'Selma El Alami', resource: 'SOC Analyst', type: 'Permission Change', severity: 'medium', result: 'success', ip: '192.168.1.45' },
  { id: 'evt_006', time: 'May 19, 2025 10:08:19 AM', event: 'Critical alert triggered', user: 'System', resource: 'Security Alerts', type: 'Alert', severity: 'critical', result: 'success', ip: '10.0.0.55' },
]

export function factorySummary() {
  const activeModules = modules.filter((m) => m.environment === 'production' && m.status !== 'disabled').length
  const healthyModules = modules.filter((m) => m.health >= 98).length
  const totalApis = modules.reduce((sum, module) => sum + module.apiCount, 0)
  const totalPages = modules.reduce((sum, module) => sum + module.pageCount, 0)
  const liveActions = actions.filter((action) => action.status === 'live').length
  const warningActions = actions.filter((action) => action.status === 'warning').length
  const deadActions = actions.filter((action) => action.status === 'dead').length
  return {
    globalHealth: 98.7,
    syncConfidence: 100,
    activeModules,
    healthyModules,
    totalModules: modules.length,
    totalApis,
    totalPages,
    totalOptions: optionGroups.reduce((sum, group) => sum + group.options, 0),
    optionGroups: optionGroups.length,
    incidents: incidents.filter((incident) => incident.status !== 'resolved').length,
    liveActions,
    warningActions,
    deadActions,
    actionCoverage: 98.6,
    activeUsers: 248,
    queuesHealthy: `${queues.filter((queue) => queue.status === 'healthy').length} / ${queues.length}`,
  }
}
