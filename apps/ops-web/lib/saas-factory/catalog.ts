import type { FactoryAction, FactoryApi, FactoryFeatureFlag, FactoryIncident, FactoryModule, FactoryOption, FactoryOptionGroup, FactoryPageKey } from './types'

export const SAAS_FACTORY_PAGES: Array<{ key: FactoryPageKey; label: string; href: string; kicker: string; description: string }> = [
  { key: 'executive', label: 'Executive Command Overview', href: '/saas-factory-command', kicker: 'CEO CONTROL', description: 'Global SaaS health, critical risks, production score, and live factory readiness.' },
  { key: 'observatory', label: 'Live System Observatory', href: '/saas-factory-command/observatory', kicker: 'LIVENESS', description: 'Live probes for modules, routes, database, realtime, queues, and external services.' },
  { key: 'modules', label: 'Module Registry', href: '/saas-factory-command/modules', kicker: 'MODULE OPS', description: 'Enable, lock, hide, stage, and monitor every AngelCare module.' },
  { key: 'configuration', label: 'Configuration Factory', href: '/saas-factory-command/configuration', kicker: 'CONFIG', description: 'Business configuration domains for cities, services, HR, academy, revenue, and market.' },
  { key: 'options', label: 'Options Registry', href: '/saas-factory-command/options', kicker: 'LIVE OPTIONS', description: 'Central dropdown/predefined values registry with module availability and audit control.' },
  { key: 'actions', label: 'Action Matrix', href: '/saas-factory-command/actions', kicker: 'BUTTONS', description: 'Button, modal, form, server action, and navigation liveness coverage.' },
  { key: 'apis', label: 'API Command Center', href: '/saas-factory-command/apis', kicker: 'API OPS', description: 'API route inventory, route ownership, smoke status, latency, and failures.' },
  { key: 'supabase', label: 'Supabase Control', href: '/saas-factory-command/supabase', kicker: 'DATABASE', description: 'Tables, migrations, RLS readiness, schema dependency and data persistence control.' },
  { key: 'realtime', label: 'Realtime Center', href: '/saas-factory-command/realtime', kicker: 'SYNC', description: 'Supabase realtime, polling fallback, LiveKit, notifications, and presence channels.' },
  { key: 'incidents', label: 'Incident Command', href: '/saas-factory-command/incidents', kicker: 'INCIDENTS', description: 'Create, assign, resolve, mute, and audit production incidents.' },
  { key: 'permissions', label: 'Permission Matrix', href: '/saas-factory-command/permissions', kicker: 'RBAC', description: 'Role, module, page, and action-level access mapping with CEO/admin overrides.' },
  { key: 'feature-flags', label: 'Feature Flags', href: '/saas-factory-command/feature-flags', kicker: 'FLAGS', description: 'Live rollout, beta exposure, emergency disable, and feature locking.' },
  { key: 'rules', label: 'Rule Builder', href: '/saas-factory-command/rules', kicker: 'AUTOMATION', description: 'Trigger, condition, and action rules across modules.' },
  { key: 'data-sources', label: 'Data Source Truth Center', href: '/saas-factory-command/data-sources', kicker: 'TRUTH', description: 'Static/demo/localStorage/API/Supabase/external source visibility and risk scoring.' },
  { key: 'queues', label: 'Queue Operations', href: '/saas-factory-command/queues', kicker: 'QUEUES', description: 'Email, sync, notification, document, and automation job monitoring.' },
  { key: 'tenants', label: 'Tenant Manager', href: '/saas-factory-command/tenants', kicker: 'SAAS', description: 'Tenant/workspace/company control for future multi-tenant SaaS operations.' },
  { key: 'deployment', label: 'Deployment Readiness', href: '/saas-factory-command/deployment', kicker: 'RELEASE', description: 'Build, TypeScript, route, env, database, and production checklist readiness.' },
  { key: 'audit', label: 'Audit Timeline', href: '/saas-factory-command/audit', kicker: 'AUDIT', description: 'System-wide trail of configuration, permission, flag, incident, and engineer actions.' },
]

export const DEFAULT_MODULES: FactoryModule[] = [
  { key: 'email_os', label: 'Email OS', route_prefix: '/email-os', owner_team: 'Engineering / Communication', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, requires_external_service: true, last_health_status: 'operational', description: 'Mailbox, compose, liveness, outbox, provider, and communication production layer.' },
  { key: 'revenue_command_center', label: 'Revenue Command Center', route_prefix: '/revenue-command-center', owner_team: 'Revenue', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Prospects, partnerships, tasks, campaigns, pipelines, market mapping, and revenue execution.' },
  { key: 'market_os', label: 'Market OS', route_prefix: '/market-os', owner_team: 'Marketing', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Campaign lifecycle, content command, ambassadors, automation, and marketing operations.' },
  { key: 'hr', label: 'HR MAX', route_prefix: '/hr', owner_team: 'Human Resources', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Employees, rosters, attendance, documents, performance, onboarding, and HR execution.' },
  { key: 'academy', label: 'Academy', route_prefix: '/academy', owner_team: 'Academy', status: 'warning', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Trainees, certificate generation, payment receipts, templates, QR, and academy operations.' },
  { key: 'service_os', label: 'Service OS', route_prefix: '/services', owner_team: 'Services', status: 'warning', visibility: 'visible', rollout_stage: 'beta', requires_realtime: false, description: 'Service blueprints, categories, commercial configuration, execution and live ops expansion.' },
  { key: 'connect', label: 'AngelCare Connect', route_prefix: '/connect', owner_team: 'Engineering / Communication', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, requires_external_service: true, description: 'Rooms, chat, calls, tasks, notifications, LiveKit, and user collaboration.' },
  { key: 'operations', label: 'Operations', route_prefix: '/operations', owner_team: 'Operations', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Missions, availability, replacements, pointage and operational execution.' },
  { key: 'billing', label: 'Billing', route_prefix: '/billing', owner_team: 'Finance', status: 'warning', visibility: 'visible', rollout_stage: 'production', description: 'Invoices, activation, contract billing, finance reports, and payment readiness.' },
  { key: 'staff_portal', label: 'Staff Portal', route_prefix: '/staff-home', owner_team: 'Staff Operations', status: 'operational', visibility: 'visible', rollout_stage: 'production', requires_realtime: true, description: 'Staff services, memos, command, intelligence, access check and field staff home.' },
]

export const DEFAULT_OPTION_GROUPS: FactoryOptionGroup[] = [
  { key: 'cities', label: 'Cities', description: 'Global cities available across Revenue, HR, Academy, Market OS, Service OS and operations.', module_scope: ['revenue_command_center', 'market_os', 'hr', 'academy', 'service_os', 'operations'], is_global: true, is_enabled: true },
  { key: 'departments', label: 'Departments', description: 'Departments used in HR, staff portal, permissions, connect tasks and assignment flows.', module_scope: ['hr', 'staff_portal', 'connect', 'operations'], is_global: true, is_enabled: true },
  { key: 'service_categories', label: 'Service Categories', description: 'Service catalog categories exposed to services, market, revenue, and operations.', module_scope: ['service_os', 'revenue_command_center', 'market_os', 'operations'], is_global: true, is_enabled: true },
  { key: 'lead_sources', label: 'Lead Sources', description: 'Revenue and market acquisition channels.', module_scope: ['revenue_command_center', 'market_os'], is_global: false, is_enabled: true },
  { key: 'task_priorities', label: 'Task Priorities', description: 'Shared priority model for tasks, incidents, revenue, connect and HR work.', module_scope: ['connect', 'hr', 'revenue_command_center', 'incidents'], is_global: true, is_enabled: true },
  { key: 'academy_locations', label: 'Academy Locations', description: 'Training location choices for academy classes, certificates, payments and receipts.', module_scope: ['academy'], is_global: false, is_enabled: true },
  { key: 'campaign_channels', label: 'Campaign Channels', description: 'Market OS and Revenue campaign execution channels.', module_scope: ['market_os', 'revenue_command_center'], is_global: false, is_enabled: true },
]

export const DEFAULT_OPTIONS: FactoryOption[] = [
  { group_key: 'cities', value: 'casablanca', label: 'Casablanca', description: 'Primary AngelCare operating city', availability_scope: ['revenue_command_center', 'market_os', 'hr', 'academy', 'service_os'], metadata_json: { country: 'Morocco', region: 'Grand Casablanca' }, is_enabled: true, is_default: true, sort_order: 10 },
  { group_key: 'cities', value: 'rabat', label: 'Rabat', description: 'Capital region operations', availability_scope: ['revenue_command_center', 'market_os', 'hr', 'academy', 'service_os'], metadata_json: { country: 'Morocco', region: 'Rabat-Salé-Kénitra' }, is_enabled: true, sort_order: 20 },
  { group_key: 'cities', value: 'marrakech', label: 'Marrakech', description: 'Expansion city', availability_scope: ['revenue_command_center', 'market_os', 'service_os'], metadata_json: { country: 'Morocco', region: 'Marrakech-Safi' }, is_enabled: true, sort_order: 30 },
  { group_key: 'departments', value: 'direction', label: 'Direction', availability_scope: ['hr', 'staff_portal', 'connect'], is_enabled: true, sort_order: 10 },
  { group_key: 'departments', value: 'human_resources', label: 'Human Resources', availability_scope: ['hr', 'staff_portal', 'connect'], is_enabled: true, sort_order: 20 },
  { group_key: 'departments', value: 'operations', label: 'Operations', availability_scope: ['operations', 'hr', 'connect'], is_enabled: true, sort_order: 30 },
  { group_key: 'departments', value: 'academy', label: 'Academy', availability_scope: ['academy', 'hr', 'connect'], is_enabled: true, sort_order: 40 },
  { group_key: 'task_priorities', value: 'urgent', label: 'Urgent', color: '#ef4444', is_enabled: true, sort_order: 10 },
  { group_key: 'task_priorities', value: 'high', label: 'High', color: '#f97316', is_enabled: true, sort_order: 20 },
  { group_key: 'task_priorities', value: 'normal', label: 'Normal', color: '#22c55e', is_enabled: true, sort_order: 30 },
  { group_key: 'service_categories', value: 'childcare', label: 'Childcare', availability_scope: ['service_os', 'revenue_command_center', 'market_os'], is_enabled: true, sort_order: 10 },
  { group_key: 'service_categories', value: 'home_support', label: 'Home Support', availability_scope: ['service_os', 'revenue_command_center'], is_enabled: true, sort_order: 20 },
  { group_key: 'lead_sources', value: 'website', label: 'Website', availability_scope: ['revenue_command_center', 'market_os'], is_enabled: true, sort_order: 10 },
  { group_key: 'lead_sources', value: 'referral', label: 'Referral', availability_scope: ['revenue_command_center'], is_enabled: true, sort_order: 20 },
]

export const DEFAULT_FEATURE_FLAGS: FactoryFeatureFlag[] = [
  { key: 'saas_factory.live_options_registry', label: 'Live Options Registry', module_key: 'saas_factory_command', status: 'enabled', rollout_stage: 'production', rollout_percent: 100, description: 'Allows predefined options to be controlled live from the factory.' },
  { key: 'saas_factory.module_registry', label: 'Module Registry Control', module_key: 'saas_factory_command', status: 'enabled', rollout_stage: 'production', rollout_percent: 100, description: 'Controls module visibility, status, and readiness.' },
  { key: 'saas_factory.action_matrix', label: 'Action Matrix', module_key: 'saas_factory_command', status: 'beta', rollout_stage: 'beta', rollout_percent: 40, description: 'Tracks buttons, modals, forms and server actions.' },
  { key: 'academy.certificate_qr', label: 'Academy Certificate QR', module_key: 'academy', status: 'enabled', rollout_stage: 'production', rollout_percent: 100, description: 'Makes certificates traceable with live QR and reference numbers.' },
  { key: 'hr.roster_print_templates', label: 'HR Roster Print Templates', module_key: 'hr', status: 'beta', rollout_stage: 'beta', rollout_percent: 60, description: 'Modern office-board print templates for daily, weekly and monthly rosters.' },
]

export const DEFAULT_INCIDENTS: FactoryIncident[] = [
  { title: 'Academy certificate template migration requires final QA', module_key: 'academy', severity: 'warning', status: 'investigating', owner: 'Engineering', source: 'factory_seed', description: 'Template generation, QR references and print fidelity need final production verification.' },
  { title: 'Service OS source map needs final table binding', module_key: 'service_os', severity: 'warning', status: 'open', owner: 'Engineering', source: 'factory_seed', description: 'Service OS is live but requires data-source truth validation across commercial and execution tables.' },
]

export const DEFAULT_ACTIONS: FactoryAction[] = [
  { module_key: 'saas_factory_command', page_path: '/saas-factory-command/options', component_name: 'OptionsRegistryPanel', action_key: 'create_option', action_label: 'Create live option', action_type: 'form', target_api: '/api/saas-factory/options', target_table: 'saas_factory_options', permission_required: 'saas_factory.options.manage', status: 'live', is_critical: true },
  { module_key: 'saas_factory_command', page_path: '/saas-factory-command/modules', component_name: 'ModuleRegistryPanel', action_key: 'update_module_status', action_label: 'Update module status', action_type: 'button', target_api: '/api/saas-factory/modules', target_table: 'saas_factory_modules', permission_required: 'saas_factory.modules.manage', status: 'live', is_critical: true },
  { module_key: 'saas_factory_command', page_path: '/saas-factory-command/feature-flags', component_name: 'FeatureFlagsPanel', action_key: 'toggle_feature_flag', action_label: 'Toggle feature flag', action_type: 'button', target_api: '/api/saas-factory/feature-flags', target_table: 'saas_factory_feature_flags', permission_required: 'saas_factory.flags.manage', status: 'live', is_critical: true },
  { module_key: 'saas_factory_command', page_path: '/saas-factory-command/incidents', component_name: 'IncidentCommandPanel', action_key: 'create_incident', action_label: 'Create incident', action_type: 'form', target_api: '/api/saas-factory/incidents', target_table: 'saas_factory_incidents', permission_required: 'saas_factory.incidents.manage', status: 'live', is_critical: true },
  { module_key: 'email_os', page_path: '/email-os', component_name: 'EmailOSWorkspace', action_key: 'send_email', action_label: 'Send email', action_type: 'server_action', target_api: '/api/email-os/send-direct', target_table: 'email_os_core_messages', permission_required: 'email_os.manage', status: 'live', is_critical: true },
  { module_key: 'hr', page_path: '/hr', component_name: 'HRCommandCenter', action_key: 'schedule_roster', action_label: 'Schedule roster', action_type: 'modal', target_api: '/api/hr/rosters', target_table: 'hr_work_schedules', permission_required: 'hr.rosters.manage', status: 'partial', is_critical: true },
]

export const DEFAULT_APIS: FactoryApi[] = [
  { route: '/api/saas-factory/overview', method: 'GET', module_key: 'saas_factory_command', status: 'operational', latency_ms: 35, owner_team: 'Engineering' },
  { route: '/api/saas-factory/options', method: 'GET/POST/PATCH', module_key: 'saas_factory_command', status: 'operational', latency_ms: 42, owner_team: 'Engineering' },
  { route: '/api/saas-factory/modules', method: 'GET/POST/PATCH', module_key: 'saas_factory_command', status: 'operational', latency_ms: 39, owner_team: 'Engineering' },
  { route: '/api/saas-factory/feature-flags', method: 'GET/POST/PATCH', module_key: 'saas_factory_command', status: 'operational', latency_ms: 44, owner_team: 'Engineering' },
  { route: '/api/saas-factory/incidents', method: 'GET/POST/PATCH', module_key: 'saas_factory_command', status: 'operational', latency_ms: 48, owner_team: 'Engineering' },
  { route: '/api/email-os/send-direct', method: 'POST', module_key: 'email_os', status: 'operational', latency_ms: 125, owner_team: 'Engineering / Communication' },
  { route: '/api/market-os/core', method: 'GET/POST', module_key: 'market_os', status: 'operational', latency_ms: 90, owner_team: 'Marketing Engineering' },
  { route: '/api/hr/production-readiness', method: 'GET', module_key: 'hr', status: 'operational', latency_ms: 85, owner_team: 'HR Engineering' },
]
