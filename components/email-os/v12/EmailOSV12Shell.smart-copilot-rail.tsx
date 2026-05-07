'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  AtSign,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Command,
  Database,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Globe,
  HardDrive,
  History,
  Inbox,
  KeyRound,
  Layers,
  LifeBuoy,
  Link2,
  Lock,
  Mail,
  MailCheck,
  MailPlus,
  MessageCircle,
  MessageSquare,
  Network,
  Paperclip,
  PauseCircle,
  PenLine,
  Plus,
  RefreshCw,
  Reply,
  Route,
  Save,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  UnlockKeyhole,
  UserCheck,
  UserCog,
  Users,
  Wand2,
  Workflow,
  Zap
} from 'lucide-react';

export type V12Mode =
  | 'command'
  | 'inbox'
  | 'threads'
  | 'composer'
  | 'access'
  | 'engine'
  | 'analytics'
  | 'configuration'
  | 'mailboxes'
  | 'templates'
  | 'automation'
  | 'audit'
  | 'approvals'
  | 'attachments'
  | 'sync'
  | 'outbox'
  | 'files'
  | 'follow-ups';

type LucideIcon = React.ComponentType<{ className?: string }>;

type Mailbox = {
  id: string;
  name: string;
  address: string;
  department: string;
  owner: string;
  provider: 'Google Workspace' | 'Microsoft 365' | 'SMTP/IMAP' | 'Shared Alias';
  status: 'Healthy' | 'Needs setup' | 'Warning' | 'Restricted';
  inbound: number;
  outbound: number;
  unresolved: number;
  slaRisk: number;
  signature: string;
  routingRule: string;
};

type Conversation = {
  id: string;
  subject: string;
  from: string;
  mailbox: string;
  owner: string;
  department: string;
  status: 'Unassigned' | 'Assigned' | 'Waiting client' | 'Waiting internal' | 'Resolved' | 'Escalated';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  sla: string;
  revenueLink: string;
  partnerLink: string;
  client: string;
  tags: string[];
  lastMessage: string;
  notes: string[];
};

type QueueJob = {
  id: string;
  job: string;
  mailbox: string;
  state: 'Running' | 'Queued' | 'Failed' | 'Completed' | 'Paused';
  owner: string;
  retry: number;
  impact: string;
};

type Permission = {
  user: string;
  role: string;
  department: string;
  mailbox: string;
  read: boolean;
  send: boolean;
  approve: boolean;
  admin: boolean;
  temporary: string;
};

type SavedView = {
  name: string;
  logic: string;
  owner: string;
  appliesTo: string;
  useCase: string;
};

const nav: Array<{ label: string; href: string; mode: V12Mode; icon: LucideIcon; tag: string; desc: string }> = [
  { label: 'Command 360', href: '/email-os/v12', mode: 'command', icon: Command, tag: 'HQ', desc: 'Unified executive email operations surface' },
  { label: 'Super Inbox', href: '/email-os/inbox/v12', mode: 'inbox', icon: Inbox, tag: 'OPS', desc: 'Multi-mailbox triage, bulk work and SLA control' },
  { label: 'Thread Dossiers', href: '/email-os/threads/v12', mode: 'threads', icon: MessageSquare, tag: 'CTX', desc: 'Conversation timeline, decisions and internal notes' },
  { label: 'Composer Studio', href: '/email-os/composer/v12', mode: 'composer', icon: Send, tag: 'SEND', desc: 'Governed send workspace with templates and approval' },
  { label: 'Access Matrix', href: '/email-os/access/v12', mode: 'access', icon: UserCog, tag: 'CEO', desc: 'Mailbox permissions by role, user and department' },
  { label: 'Engine Center', href: '/email-os/engine/v12', mode: 'engine', icon: Server, tag: 'RUN', desc: 'Queues, sync jobs, delivery failures and retries' },
  { label: 'Analytics', href: '/email-os/analytics/v12', mode: 'analytics', icon: BarChart3, tag: 'BI', desc: 'Volume, SLA, workload and delivery intelligence' },
  { label: 'Configuration', href: '/email-os/configuration/v12', mode: 'configuration', icon: Settings, tag: 'CFG', desc: 'Providers, mailboxes, routing, signatures and rules' },
  { label: 'Mailboxes', href: '/email-os/mailboxes', mode: 'mailboxes', icon: Mail, tag: 'BOX', desc: 'Operational mailbox registry' },
  { label: 'Templates', href: '/email-os/templates', mode: 'templates', icon: FileText, tag: 'TPL', desc: 'Reusable reply and outbound templates' },
  { label: 'Automation', href: '/email-os/automation', mode: 'automation', icon: Workflow, tag: 'AUTO', desc: 'Rules, triggers and escalations' },
  { label: 'Approvals', href: '/email-os/approvals', mode: 'approvals', icon: BadgeCheck, tag: 'APP', desc: 'Review queue for governed sends' },
  { label: 'Audit', href: '/email-os/audit', mode: 'audit', icon: History, tag: 'LOG', desc: 'Security and execution history' },
];

const mailboxes: Mailbox[] = [
  { id: 'mbx-ceo', name: 'CEO Office', address: 'ceo@angelcare.ma', department: 'Executive', owner: 'CEO Office', provider: 'Google Workspace', status: 'Restricted', inbound: 64, outbound: 39, unresolved: 11, slaRisk: 4, signature: 'Executive formal signature', routingRule: 'CEO urgent and partnerships only' },
  { id: 'mbx-ops', name: 'Operations', address: 'operations@angelcare.ma', department: 'Operations', owner: 'Operations Lead', provider: 'Microsoft 365', status: 'Healthy', inbound: 184, outbound: 92, unresolved: 38, slaRisk: 13, signature: 'Operational support signature', routingRule: 'Route unresolved care cases to operations board' },
  { id: 'mbx-billing', name: 'Billing', address: 'billing@angelcare.ma', department: 'Finance', owner: 'Billing Manager', provider: 'SMTP/IMAP', status: 'Warning', inbound: 96, outbound: 41, unresolved: 22, slaRisk: 9, signature: 'Billing and invoice signature', routingRule: 'Invoice, payment and refund tags' },
  { id: 'mbx-hr', name: 'HR', address: 'hr@angelcare.ma', department: 'HR', owner: 'HR Manager', provider: 'Google Workspace', status: 'Healthy', inbound: 51, outbound: 28, unresolved: 7, slaRisk: 2, signature: 'HR confidentiality signature', routingRule: 'Candidate, staff and caregiver cases' },
  { id: 'mbx-incident', name: 'Incident Desk', address: 'incident@angelcare.ma', department: 'Risk', owner: 'Incident Officer', provider: 'Shared Alias', status: 'Healthy', inbound: 18, outbound: 14, unresolved: 5, slaRisk: 5, signature: 'Incident escalation signature', routingRule: 'Critical cases escalate in 15 minutes' },
  { id: 'mbx-family', name: 'Family Support', address: 'families@angelcare.ma', department: 'Care', owner: 'Care Experience', provider: 'Google Workspace', status: 'Healthy', inbound: 132, outbound: 74, unresolved: 25, slaRisk: 10, signature: 'Family support signature', routingRule: 'Care family inquiries and satisfaction loops' },
  { id: 'mbx-academy', name: 'Academy', address: 'academy@angelcare.ma', department: 'Academy', owner: 'Training Center', provider: 'Microsoft 365', status: 'Healthy', inbound: 73, outbound: 58, unresolved: 12, slaRisk: 3, signature: 'Academy training signature', routingRule: 'Trainee, trainer and client training requests' },
  { id: 'mbx-sales', name: 'Sales', address: 'sales@angelcare.ma', department: 'Revenue', owner: 'Sales Director', provider: 'Google Workspace', status: 'Healthy', inbound: 119, outbound: 151, unresolved: 18, slaRisk: 6, signature: 'Revenue signature', routingRule: 'Lead, deal and proposal communications' },
  { id: 'mbx-marketing', name: 'Marketing', address: 'marketing@angelcare.ma', department: 'Marketing', owner: 'Marketing Lead', provider: 'Shared Alias', status: 'Needs setup', inbound: 47, outbound: 88, unresolved: 14, slaRisk: 8, signature: 'Brand signature', routingRule: 'Campaigns, ambassadors and content contacts' },
  { id: 'mbx-legal', name: 'Legal', address: 'legal@angelcare.ma', department: 'Legal', owner: 'Legal Admin', provider: 'SMTP/IMAP', status: 'Restricted', inbound: 31, outbound: 17, unresolved: 6, slaRisk: 2, signature: 'Legal notice signature', routingRule: 'Contracts, claims and legal docs only' },
  { id: 'mbx-partner', name: 'Partnerships', address: 'partners@angelcare.ma', department: 'Partnerships', owner: 'Partnership Manager', provider: 'Google Workspace', status: 'Healthy', inbound: 68, outbound: 44, unresolved: 16, slaRisk: 7, signature: 'Partnership signature', routingRule: 'Partner opportunities, MoU and institution contact' },
  { id: 'mbx-general', name: 'General', address: 'contact@angelcare.ma', department: 'Front Desk', owner: 'Reception', provider: 'Google Workspace', status: 'Healthy', inbound: 240, outbound: 55, unresolved: 71, slaRisk: 21, signature: 'General contact signature', routingRule: 'Auto-classify and triage to correct department' },
];

const conversations: Conversation[] = [
  { id: 'THR-1001', subject: 'Urgent family care schedule change', from: 'Mme Benali', mailbox: 'Family Support', owner: 'Care Experience', department: 'Care', status: 'Escalated', priority: 'Critical', sla: '12 min left', revenueLink: 'Contract AC-422', partnerLink: 'Care Plan CP-91', client: 'Benali Family', tags: ['schedule', 'caregiver', 'urgent'], lastMessage: 'Family requests immediate replacement for tomorrow morning visit.', notes: ['Escalated to operations', 'Caregiver backup needed'] },
  { id: 'THR-1002', subject: 'Invoice correction request for March services', from: 'Accounts Payable', mailbox: 'Billing', owner: 'Billing Manager', department: 'Finance', status: 'Waiting internal', priority: 'High', sla: '2h 15m', revenueLink: 'Invoice INV-2039', partnerLink: 'Client Ledger', client: 'Bennis Holding', tags: ['invoice', 'correction', 'finance'], lastMessage: 'The March invoice has a discrepancy on night shift hours.', notes: ['Need timesheet proof', 'Finance approval required'] },
  { id: 'THR-1003', subject: 'Corporate training proposal for caregivers', from: 'HR Director', mailbox: 'Academy', owner: 'Training Center', department: 'Academy', status: 'Assigned', priority: 'High', sla: '5h 30m', revenueLink: 'Opportunity OPP-774', partnerLink: 'Training Program TP-24', client: 'Casablanca Senior Care', tags: ['academy', 'proposal', 'B2B'], lastMessage: 'Client requested a detailed training calendar and price structure.', notes: ['Link to Academy proposal', 'Prepare commercial PDF'] },
  { id: 'THR-1004', subject: 'Ambassador collaboration request', from: 'Influencer Agency', mailbox: 'Marketing', owner: 'Marketing Lead', department: 'Marketing', status: 'Unassigned', priority: 'Normal', sla: '1 day', revenueLink: 'Campaign MK-58', partnerLink: 'Ambassador Funnel', client: 'Atlas Influence', tags: ['ambassador', 'campaign', 'brand'], lastMessage: 'Agency wants to discuss ambassador packages and posting schedule.', notes: ['Needs Market OS link'] },
  { id: 'THR-1005', subject: 'Restricted legal contract review', from: 'Legal Counsel', mailbox: 'Legal', owner: 'Legal Admin', department: 'Legal', status: 'Waiting internal', priority: 'High', sla: '6h 05m', revenueLink: 'Contract CTR-811', partnerLink: 'Partner Legal Folder', client: 'Health Partner SARL', tags: ['contract', 'restricted', 'partner'], lastMessage: 'Please verify liability wording before signature.', notes: ['CEO access required', 'Legal restricted mailbox'] },
  { id: 'THR-1006', subject: 'Lead asking for home care package', from: 'Prospect Family', mailbox: 'Sales', owner: 'Sales Director', department: 'Revenue', status: 'Assigned', priority: 'High', sla: '1h 40m', revenueLink: 'Lead L-889', partnerLink: 'Sales Pipeline', client: 'New Family Prospect', tags: ['lead', 'package', 'pricing'], lastMessage: 'Prospect wants pricing for 7-day support in Rabat.', notes: ['Create quote', 'Call before 18:00'] },
  { id: 'THR-1007', subject: 'SMTP delivery failure - operations mailbox', from: 'System', mailbox: 'Operations', owner: 'Engine', department: 'Infrastructure', status: 'Escalated', priority: 'Critical', sla: 'Now', revenueLink: 'Engine Job Q-22', partnerLink: 'SMTP Provider', client: 'Internal', tags: ['smtp', 'failure', 'queue'], lastMessage: '3 messages failed during delivery window.', notes: ['Retry queue pending', 'Check provider credentials'] },
  { id: 'THR-1008', subject: 'Candidate caregiver documents', from: 'Candidate Amina', mailbox: 'HR', owner: 'HR Manager', department: 'HR', status: 'Assigned', priority: 'Normal', sla: '8h 00m', revenueLink: 'Candidate HR-310', partnerLink: 'Recruitment', client: 'Internal HR', tags: ['candidate', 'documents', 'caregiver'], lastMessage: 'Candidate attached updated documents for review.', notes: ['Move attachments to HR file'] },
];

const queueJobs: QueueJob[] = [
  { id: 'JOB-001', job: 'Sync Operations inbox', mailbox: 'Operations', state: 'Running', owner: 'Sync Engine', retry: 0, impact: '184 messages scanned' },
  { id: 'JOB-002', job: 'Retry failed Billing sends', mailbox: 'Billing', state: 'Queued', owner: 'Delivery Engine', retry: 2, impact: '4 invoices waiting' },
  { id: 'JOB-003', job: 'Classify General inbox', mailbox: 'General', state: 'Running', owner: 'AI Classifier', retry: 0, impact: '240 messages routed' },
  { id: 'JOB-004', job: 'SMTP credential check', mailbox: 'Marketing', state: 'Failed', owner: 'Provider Health', retry: 3, impact: 'Setup incomplete' },
  { id: 'JOB-005', job: 'Export restricted audit', mailbox: 'Legal', state: 'Completed', owner: 'Audit Engine', retry: 0, impact: 'Legal access exported' },
  { id: 'JOB-006', job: 'Create follow-up tasks', mailbox: 'Sales', state: 'Queued', owner: 'Revenue Linker', retry: 0, impact: '12 deal tasks pending' },
];

const permissions: Permission[] = [
  { user: 'CEO Office', role: 'Executive', department: 'Executive', mailbox: 'CEO Office', read: true, send: true, approve: true, admin: true, temporary: 'Permanent' },
  { user: 'Operations Lead', role: 'Manager', department: 'Operations', mailbox: 'Operations', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
  { user: 'Billing Manager', role: 'Manager', department: 'Finance', mailbox: 'Billing', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
  { user: 'HR Manager', role: 'Manager', department: 'HR', mailbox: 'HR', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
  { user: 'Marketing Lead', role: 'Lead', department: 'Marketing', mailbox: 'Marketing', read: true, send: true, approve: false, admin: false, temporary: 'Until provider setup' },
  { user: 'Legal Admin', role: 'Restricted', department: 'Legal', mailbox: 'Legal', read: true, send: false, approve: false, admin: false, temporary: 'Case-by-case' },
  { user: 'Sales Director', role: 'Director', department: 'Revenue', mailbox: 'Sales', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
  { user: 'Academy Manager', role: 'Manager', department: 'Academy', mailbox: 'Academy', read: true, send: true, approve: false, admin: false, temporary: 'Permanent' },
];

const savedViews: SavedView[] = [
  { name: 'CEO critical only', logic: 'priority=Critical OR mailbox=CEO Office OR restricted=true', owner: 'CEO Office', appliesTo: 'Executive', useCase: 'See only highest risk communications' },
  { name: 'Unassigned revenue leads', logic: 'mailbox=Sales AND status=Unassigned', owner: 'Sales Director', appliesTo: 'Sales', useCase: 'Never lose a hot family or B2B lead' },
  { name: 'Billing SLA risk', logic: 'mailbox=Billing AND slaRisk=true', owner: 'Billing Manager', appliesTo: 'Finance', useCase: 'Protect collections and reduce invoice disputes' },
  { name: 'Care urgent desk', logic: 'department=Care AND priority in High,Critical', owner: 'Care Experience', appliesTo: 'Care', useCase: 'Immediate family/caregiver operational issues' },
  { name: 'Provider failures', logic: 'tags contains smtp OR state=Failed', owner: 'Engine', appliesTo: 'Infrastructure', useCase: 'Delivery reliability command view' },
  { name: 'Training business pipeline', logic: 'mailbox=Academy AND tags contains proposal', owner: 'Training Center', appliesTo: 'Academy', useCase: 'B2B training proposal follow-up' },
];

const templates = [
  { name: 'Family schedule apology', category: 'Care', approval: 'No approval', variables: ['family_name', 'visit_date', 'replacement_name'], quality: 94 },
  { name: 'Invoice correction response', category: 'Billing', approval: 'Finance approval', variables: ['invoice_id', 'period', 'correction_reason'], quality: 91 },
  { name: 'Training proposal follow-up', category: 'Academy', approval: 'Sales approval', variables: ['company_name', 'training_program', 'next_step'], quality: 88 },
  { name: 'Restricted legal acknowledgement', category: 'Legal', approval: 'CEO approval', variables: ['case_id', 'legal_contact', 'deadline'], quality: 97 },
  { name: 'Lead qualification reply', category: 'Sales', approval: 'No approval', variables: ['prospect_name', 'service_area', 'consultation_time'], quality: 92 },
  { name: 'Ambassador partnership intro', category: 'Marketing', approval: 'Marketing approval', variables: ['agency_name', 'campaign_name', 'deliverables'], quality: 86 },
];

const automationRules = [
  { name: 'Critical family escalation', trigger: 'priority=Critical AND mailbox=Family Support', action: 'Assign Operations Lead + notify CEO Office', status: 'Active', risk: 'High value' },
  { name: 'Billing dispute proof request', trigger: 'tags include invoice AND correction', action: 'Attach timesheet request + create finance task', status: 'Active', risk: 'Medium' },
  { name: 'Sales lead SLA', trigger: 'mailbox=Sales AND status=Unassigned > 20min', action: 'Assign Sales Director + create call task', status: 'Active', risk: 'Revenue' },
  { name: 'SMTP failure retry guard', trigger: 'delivery_failed >= 2', action: 'Pause provider + move to retry queue', status: 'Active', risk: 'Infrastructure' },
  { name: 'Legal restricted access', trigger: 'mailbox=Legal', action: 'Block send without CEO approval', status: 'Active', risk: 'Compliance' },
  { name: 'Academy proposal next step', trigger: 'tags include academy,proposal', action: 'Create follow-up in 24h', status: 'Draft', risk: 'Revenue' },
];

const auditRows = [
  { time: '09:14', actor: 'Operations Lead', action: 'Bulk assigned 6 conversations', target: 'Operations inbox', result: 'Completed' },
  { time: '09:22', actor: 'Delivery Engine', action: 'Retried failed SMTP job', target: 'Billing', result: 'Queued' },
  { time: '09:31', actor: 'CEO Office', action: 'Opened restricted legal thread', target: 'THR-1005', result: 'Allowed' },
  { time: '09:45', actor: 'Marketing Lead', action: 'Attempted send from Marketing', target: 'marketing@angelcare.ma', result: 'Blocked: setup incomplete' },
  { time: '10:05', actor: 'AI Classifier', action: 'Routed 42 general messages', target: 'General inbox', result: 'Completed' },
  { time: '10:12', actor: 'Sales Director', action: 'Linked message to deal', target: 'Lead L-889', result: 'Completed' },
];

const configurationSections = [
  { title: 'Provider connections', icon: Globe, fields: ['Google Workspace OAuth', 'Microsoft Graph OAuth', 'Custom SMTP host', 'Custom IMAP host', 'Token refresh policy', 'Connection test'] },
  { title: 'Mailbox registry', icon: Mail, fields: ['Business address', 'Department owner', 'Send identity', 'Default reply owner', 'Restricted flag', 'Operational status'] },
  { title: 'Routing rules', icon: Route, fields: ['Keyword routing', 'Department classifier', 'SLA category', 'Escalation owner', 'Auto-tag policy', 'Revenue linker'] },
  { title: 'Security policies', icon: ShieldCheck, fields: ['Read permission', 'Send permission', 'Approval gate', 'Temporary access', 'Audit retention', 'Restricted content rule'] },
  { title: 'Signatures', icon: PenLine, fields: ['Department signature', 'Legal disclaimer', 'Brand footer', 'User override', 'Language variation', 'Template binding'] },
  { title: 'Automation', icon: Workflow, fields: ['Trigger', 'Condition', 'Action', 'Notification', 'Retry guard', 'Pause rule'] },
];

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

function useEmailOsDraftState() {
  const [draftSubject, setDraftSubject] = useState('Follow-up regarding your AngelCare request');
  const [draftBody, setDraftBody] = useState('Hello,\n\nThank you for contacting AngelCare. We reviewed your request and prepared the next operational step.\n\nBest regards,\nAngelCare Team');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].name);
  const [storedActions, setStoredActions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('angelcare-email-os-v12-actions');
      if (raw) setStoredActions(JSON.parse(raw));
    } catch {}
  }, []);

  const pushAction = (action: string) => {
    const line = `${new Date().toLocaleTimeString()} · ${action}`;
    setStoredActions((current) => {
      const next = [line, ...current].slice(0, 25);
      try { localStorage.setItem('angelcare-email-os-v12-actions', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { draftSubject, setDraftSubject, draftBody, setDraftBody, selectedTemplate, setSelectedTemplate, storedActions, pushAction };
}

function MetricCard({ label, value, icon: Icon, helper, tone = 'cyan' }: { label: string; value: string; icon: LucideIcon; helper: string; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' }) {
  const tones = {
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  };
  return (
    <div className="rounded-3xl border border-slate-700/80 bg-[#0b1220] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className={cx('rounded-2xl border p-3', tones[tone])}><Icon className="h-6 w-6" /></div>
        <Activity className="h-4 w-4 animate-pulse text-cyan-300" />
      </div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{label}</div>
      <div className="mt-2 text-xs leading-5 text-slate-400">{helper}</div>
    </div>
  );
}

function Panel({ title, icon: Icon, desc, children, actions }: { title: string; icon: LucideIcon; desc?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-200"><Icon className="h-6 w-6" /></div>
          <div>
            <h3 className="text-xl font-black text-white md:text-2xl">{title}</h3>
            {desc ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">{desc}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, icon: Icon = Zap, onClick, tone = 'cyan' }: { children: React.ReactNode; icon?: LucideIcon; onClick?: () => void; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const tones = {
    cyan: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-slate-950',
    emerald: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300 hover:text-slate-950',
    amber: 'border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300 hover:text-slate-950',
    rose: 'border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300 hover:text-slate-950',
    slate: 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800',
  };
  return (
    <button type="button" onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70', tones[tone])}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function StatusPill({ value }: { value: string }) {
  const color = value.includes('Critical') || value.includes('Failed') || value.includes('Escalated') || value.includes('Restricted')
    ? 'border-rose-300/40 bg-rose-400/10 text-rose-200'
    : value.includes('Warning') || value.includes('Waiting') || value.includes('Needs') || value.includes('Queued')
      ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
      : value.includes('Healthy') || value.includes('Completed') || value.includes('Resolved') || value.includes('Active')
        ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200'
        : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200';
  return <span className={cx('rounded-full border px-3 py-1 text-xs font-bold', color)}>{value}</span>;
}

function MiniTimeline({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="grid h-7 w-7 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-xs font-black text-cyan-100">{index + 1}</div>
            {index < items.length - 1 ? <div className="h-full w-px bg-slate-700" /> : null}
          </div>
          <div className="pb-4 text-sm leading-6 text-slate-300">{item}</div>
        </div>
      ))}
    </div>
  );
}

function DataRow({ left, middle, right, icon: Icon = ChevronRight }: { left: React.ReactNode; middle?: React.ReactNode; right?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-700/70 bg-[#08111f] p-4 text-sm md:grid-cols-[1fr_1fr_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3 text-slate-100"><Icon className="h-4 w-4 shrink-0 text-cyan-300" /><div className="min-w-0">{left}</div></div>
      <div className="text-slate-300">{middle}</div>
      <div className="flex justify-start md:justify-end">{right}</div>
    </div>
  );
}

function ShellHeader({ title, activeNav, selectedMailbox, setSelectedMailbox, query, setQuery, pushAction }: { title: string; activeNav?: typeof nav[number]; selectedMailbox: string; setSelectedMailbox: (v: string) => void; query: string; setQuery: (v: string) => void; pushAction: (v: string) => void }) {
  return (
    <header className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-200">AngelCare corporate email command</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300 md:text-base">{activeNav?.desc || 'Operational email workspace for routing, composing, permissions, configuration, delivery health and company-grade audit control.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedMailbox} onChange={(e) => setSelectedMailbox(e.target.value)} className="rounded-2xl border border-cyan-300/40 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 shadow-lg shadow-black/20">
            {mailboxes.map(m => <option key={m.name}>{m.name}</option>)}
          </select>
          <ActionButton icon={RefreshCw} onClick={() => pushAction('Manual refresh requested for ' + selectedMailbox)}>Refresh pulse</ActionButton>
          <ActionButton icon={Plus} tone="emerald" onClick={() => pushAction('New controlled email action started')}>New action</ActionButton>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search thread, mailbox, deal, contact, note, failure log, template..." className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400" />
        </div>
        <ActionButton icon={Filter} tone="slate">Saved filters</ActionButton>
        <ActionButton icon={Download} tone="slate">Export view</ActionButton>
      </div>
    </header>
  );
}

function LeftNavigation({ pathname, router }: { pathname: string | null; router: ReturnType<typeof useRouter> }) {
  return (
    <aside className="hidden w-84 shrink-0 border-r border-cyan-400/20 bg-slate-950/95 p-5 backdrop-blur-xl xl:block">
      <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5 shadow-2xl shadow-cyan-950/40">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-300/20 p-3"><Network className="h-7 w-7 text-cyan-200" /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">AngelCare</p>
            <h1 className="text-xl font-black text-white">Email OS V12</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">Company-wide email operations for inbox execution, provider setup, controlled sending, user permissions, audits and engine health.</p>
      </div>
      <nav className="mt-6 space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/') || (item.href !== '/email-os/v12' && pathname?.includes(item.href.replace('/email-os/', '').replace('/v12', '')));
          return (
            <button key={item.href} type="button" onClick={() => router.push(item.href)} className={cx('w-full rounded-2xl border p-4 text-left transition', active ? 'border-cyan-300/70 bg-cyan-300/20 text-white shadow-lg shadow-cyan-950/40' : 'border-slate-700/70 bg-[#0b1220] text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800/90 hover:text-white')}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-200" /><span className="font-semibold text-inherit">{item.label}</span></span>
                <span className="rounded-full border border-cyan-300/40 px-2 py-1 text-[10px] text-cyan-100">{item.tag}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.desc}</p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function RightRail({ storedActions }: { storedActions: string[] }) {
  const [showMemory, setShowMemory] = useState(false);
  const criticalThreads = conversations.filter((c) => c.priority === 'Critical' || c.status === 'Escalated');
  const unresolvedThreads = conversations.filter((c) => c.status !== 'Resolved');
  const failedJobs = queueJobs.filter((job) => job.state === 'Failed');
  const restrictedMailboxes = mailboxes.filter((mailbox) => mailbox.status === 'Restricted' || mailbox.status === 'Needs setup');
  const latestSignal = storedActions[0] || 'No operator command captured yet';

  const intelligenceCards = [
    {
      label: 'Critical command',
      value: String(criticalThreads.length),
      helper: criticalThreads.length ? `${criticalThreads[0].id} · ${criticalThreads[0].subject}` : 'No critical thread currently raised.',
      icon: AlertTriangle,
      tone: 'rose',
    },
    {
      label: 'Provider blockers',
      value: String(failedJobs.length + restrictedMailboxes.length),
      helper: failedJobs[0]?.impact || restrictedMailboxes[0]?.routingRule || 'No infrastructure blocker detected.',
      icon: ShieldCheck,
      tone: 'amber',
    },
    {
      label: 'Open workload',
      value: String(unresolvedThreads.length),
      helper: 'Threads requiring owner, reply, resolution, approval or follow-up.',
      icon: Inbox,
      tone: 'cyan',
    },
  ];

  const nextActions = [
    criticalThreads.length ? `Escalate ${criticalThreads[0].id} before SLA breach` : 'Monitor critical queue',
    failedJobs.length ? `Repair provider job ${failedJobs[0].id}` : 'Keep delivery engine under watch',
    restrictedMailboxes.length ? `Review ${restrictedMailboxes[0].name} access/setup policy` : 'Permissions stable',
  ];

  const commandMemory = storedActions.length
    ? storedActions.slice(0, 6)
    : ['Command memory is clean. Actions will appear here as operational signals, not raw noise.'];

  return (
    <aside className="space-y-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/30 bg-[#07111f] p-5 shadow-2xl shadow-cyan-950/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_35%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-100 shadow-lg shadow-cyan-950/40">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-200">AI Command Intelligence</p>
              <h3 className="mt-1 text-xl font-black text-white">Email Copilot Rail</h3>
              <p className="mt-2 text-xs leading-5 text-slate-300">Operational guidance, risk radar and command memory for the current workspace.</p>
            </div>
          </div>
          <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black text-emerald-200">ONLINE</div>
        </div>

        <div className="relative mt-5 grid gap-3">
          {intelligenceCards.map((card) => {
            const Icon = card.icon;
            const tone = card.tone === 'rose'
              ? 'border-rose-300/30 bg-rose-400/10 text-rose-200'
              : card.tone === 'amber'
                ? 'border-amber-300/30 bg-amber-400/10 text-amber-200'
                : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200';
            return (
              <div key={card.label} className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
                    <div className="mt-1 text-3xl font-black text-white">{card.value}</div>
                  </div>
                  <div className={cx('rounded-2xl border p-2', tone)}><Icon className="h-5 w-5" /></div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">{card.helper}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-violet-300/25 bg-violet-400/10 p-5 shadow-2xl shadow-violet-950/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200">Next best actions</p>
            <h3 className="mt-1 text-lg font-black text-white">Smart execution queue</h3>
          </div>
          <Sparkles className="h-5 w-5 text-violet-200" />
        </div>
        <div className="mt-4 space-y-2">
          {nextActions.map((action, index) => (
            <div key={action} className="flex items-start gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3 text-sm text-slate-200">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-violet-300/30 bg-violet-300/10 text-xs font-black text-violet-100">{index + 1}</div>
              <div>
                <div className="font-bold text-white">{action}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">Recommended from current workload, provider state and restricted mailbox signals.</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-emerald-400/40 bg-black p-5 font-mono shadow-2xl shadow-emerald-950/40">
        <div className="mb-4 flex items-center justify-between text-emerald-300"><span>LIVE EMAIL PULSE</span><RefreshCw className="h-4 w-4 animate-spin" /></div>
        {['Provider guard active', 'Reader layer armed', 'Command memory synced', 'Revenue linker watching', 'SLA radar scanning', 'Permission shield online'].map((line, i) => (
          <div key={line} className="mb-2 text-sm text-emerald-300">[{String(i + 1).padStart(2, '0')}] {line}<span className="animate-pulse"> _</span></div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-700/80 bg-[#0b1220] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">Command memory</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">Latest signal: <span className="text-cyan-200">{latestSignal}</span></p>
          </div>
          <button type="button" onClick={() => setShowMemory((current) => !current)} className="rounded-2xl border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-300/50 hover:text-cyan-100">
            {showMemory ? 'Hide log' : 'Show log'}
          </button>
        </div>
        {showMemory ? (
          <div className="mt-4 space-y-2">
            {commandMemory.map((op) => (
              <div key={op} className="flex items-start gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/70 p-3 text-sm text-slate-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{op}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
            Activity is summarized as intelligence instead of showing a noisy click recorder. Open the log only when you need audit/debug visibility.
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-amber-400/30 bg-amber-400/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-200" />
          <div>
            <h3 className="font-black text-white">Production connector status</h3>
            <p className="mt-2 text-sm leading-6 text-amber-100/90">UI execution is active. External delivery, inbox sync and provider verification become live after credentials and database binding are connected.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function EmailOSV12Shell({ mode = 'command' }: { mode?: V12Mode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [selectedMailbox, setSelectedMailbox] = useState('Operations');
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [activeEmailId, setActiveEmailId] = useState<string | null>(conversations[0]?.id || null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const draft = useEmailOsDraftState();

  const activeNav = useMemo(() => nav.find((n) => n.mode === mode) || nav.find((n) => pathname?.startsWith(n.href)), [mode, pathname]);
  const title = activeNav?.label || 'Command 360';

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter(c => [c.subject, c.from, c.mailbox, c.owner, c.department, c.status, c.priority, c.revenueLink, c.partnerLink, c.client, c.lastMessage, ...c.tags].join(' ').toLowerCase().includes(normalized));
  }, [query]);

  const selectedConversationObjects = useMemo(() => conversations.filter(c => selectedThreads.includes(c.id)), [selectedThreads]);
  const activeEmail = useMemo(() => conversations.find(c => c.id === activeEmailId) || filteredConversations[0] || conversations[0], [activeEmailId, filteredConversations]);

  const openEmail = (id: string) => {
    setActiveEmailId(id);
    setIsReaderOpen(true);
    draft.pushAction('Opened email reader for ' + id);
  };

  const toggleThread = (id: string) => {
    setSelectedThreads((current) => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  return (
    <div className="email-os-v12-scope min-h-screen bg-slate-950 text-slate-100 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-cyan-300/70 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_input]:text-slate-100 [&_input]:placeholder:text-slate-400 [&_label]:text-slate-200 [&_option]:bg-slate-950 [&_option]:text-slate-100 [&_p]:text-slate-300 [&_select]:text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="relative flex min-h-screen">
        <LeftNavigation pathname={pathname} router={router} />
        <main className="flex-1 p-4 md:p-8">
          <ShellHeader title={title} activeNav={activeNav} selectedMailbox={selectedMailbox} setSelectedMailbox={setSelectedMailbox} query={query} setQuery={setQuery} pushAction={draft.pushAction} />
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active mailboxes" value={String(mailboxes.length)} icon={Mail} helper="Operational registry with owners, providers and routing rules." />
            <MetricCard label="Unresolved threads" value={String(conversations.filter(c => c.status !== 'Resolved').length)} icon={Inbox} helper="Across family, revenue, billing, HR, legal and operations." tone="amber" />
            <MetricCard label="SLA risk" value={String(mailboxes.reduce((sum, m) => sum + m.slaRisk, 0))} icon={Timer} helper="Items needing priority triage or escalation." tone="rose" />
            <MetricCard label="Health score" value="92%" icon={Gauge} helper="Frontend + API scaffolding ready, provider credentials pending." tone="emerald" />
          </section>
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              {mode === 'command' && <CommandDashboard pushAction={draft.pushAction} router={router} openEmail={openEmail} />}
              {mode === 'inbox' && <SuperInbox conversations={filteredConversations} selectedThreads={selectedThreads} toggleThread={toggleThread} pushAction={draft.pushAction} openEmail={openEmail} />}
              {mode === 'threads' && <ThreadDossiers conversations={filteredConversations} selectedThreads={selectedThreads} toggleThread={toggleThread} pushAction={draft.pushAction} openEmail={openEmail} />}
              {mode === 'composer' && <ComposerStudio draft={draft} selectedConversationObjects={selectedConversationObjects} />}
              {mode === 'access' && <AccessMatrix pushAction={draft.pushAction} />}
              {mode === 'engine' && <EngineCenter pushAction={draft.pushAction} />}
              {mode === 'analytics' && <AnalyticsCenter />}
              {mode === 'configuration' && <ConfigurationCenter pushAction={draft.pushAction} />}
              {mode === 'mailboxes' && <MailboxRegistry pushAction={draft.pushAction} />}
              {mode === 'templates' && <TemplateCenter draft={draft} />}
              {mode === 'automation' && <AutomationCenter pushAction={draft.pushAction} />}
              {mode === 'audit' && <AuditCenter />}
              {mode === 'approvals' && <ApprovalCenter pushAction={draft.pushAction} />}
              {mode === 'attachments' && <AttachmentCenter pushAction={draft.pushAction} />}
              {mode === 'sync' && <SyncCenter pushAction={draft.pushAction} />}
              {mode === 'outbox' && <OutboxCenter pushAction={draft.pushAction} />}
              {mode === 'files' && <FileCenter pushAction={draft.pushAction} />}
              {mode === 'follow-ups' && <FollowUpCenter pushAction={draft.pushAction} />}
            </div>
            <RightRail storedActions={draft.storedActions} />
          </section>
        </main>
        <EmailReaderDrawer
          conversation={activeEmail}
          open={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          onReply={() => {
            draft.setDraftSubject('Re: ' + activeEmail.subject);
            draft.setDraftBody('Hello,\n\nFollowing up on: ' + activeEmail.subject + '\n\n' + activeEmail.lastMessage + '\n\nBest regards,\nAngelCare Team');
            draft.pushAction('Reply draft prepared for ' + activeEmail.id);
            router.push('/email-os/composer/v12');
          }}
          onResolve={() => draft.pushAction('Marked resolved from reader: ' + activeEmail.id)}
          onArchive={() => draft.pushAction('Archived from reader: ' + activeEmail.id)}
          onEscalate={() => draft.pushAction('Escalated from reader: ' + activeEmail.id)}
          onCreateTask={() => draft.pushAction('Follow-up task created from reader: ' + activeEmail.id)}
        />
      </div>
    </div>
  );
}

function CommandDashboard({ pushAction, router, openEmail }: { pushAction: (v: string) => void; router: ReturnType<typeof useRouter>; openEmail: (id: string) => void }) {
  return (
    <>
      <Panel title="Executive command surface" icon={Sparkles} desc="Not a generic template: this is the place where leadership sees health, unresolved risk, mailbox ownership, provider status and operational actions." actions={<><ActionButton icon={Inbox} onClick={() => router.push('/email-os/inbox/v12')}>Open inbox</ActionButton><ActionButton icon={Settings} onClick={() => router.push('/email-os/configuration/v12')} tone="emerald">Configure</ActionButton></>}>
        <div className="grid gap-4 md:grid-cols-2">
          {[{ title: 'Inbox execution', icon: Inbox, items: ['Bulk assign unresolved conversations', 'Saved views by department and risk', 'SLA escalation and owner control', 'Revenue/client/partner linking'] }, { title: 'Send governance', icon: Send, items: ['Mailbox identity selection', 'Approval gate for restricted mailboxes', 'Template variable quality checks', 'Outbox queue and scheduled sends'] }, { title: 'Infrastructure control', icon: Server, items: ['SMTP/IMAP/Graph provider status', 'Retry failed delivery jobs', 'Mailbox sync logs and throttling', 'Provider setup guardrails'] }, { title: 'Security and audit', icon: Shield, items: ['Read/send/approve/admin permissions', 'Temporary access windows', 'Restricted mailbox warnings', 'Exportable audit trail'] }].map(block => (
            <div key={block.title} className="rounded-3xl border border-slate-700/80 bg-[#08111f] p-5">
              <div className="flex items-center gap-3"><block.icon className="h-6 w-6 text-cyan-200" /><h4 className="text-lg font-black text-white">{block.title}</h4></div>
              <div className="mt-4 space-y-2">{block.items.map(item => <DataRow key={item} left={<span className="font-semibold text-slate-100">{item}</span>} right={<ActionButton onClick={() => pushAction(item)} icon={Zap}>Run</ActionButton>} />)}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Live business-linked priority board" icon={Target} desc="Turns emails into actionable company operations instead of leaving them as passive messages.">
        <div className="grid gap-3">
          {conversations.slice(0, 5).map(c => <DataRow key={c.id} icon={MailCheck} left={<><div className="font-black text-white">{c.subject}</div><div className="text-xs text-slate-400">{c.id} · {c.client}</div></>} middle={<><StatusPill value={c.priority} /> <span className="ml-2 text-slate-300">{c.revenueLink}</span></>} right={<><ActionButton onClick={() => openEmail(c.id)} icon={Eye}>Read</ActionButton><ActionButton onClick={() => pushAction('Opened command action for ' + c.id)} icon={ArrowRight}>Command</ActionButton></>} />)}
        </div>
      </Panel>
    </>
  );
}

function SuperInbox({ conversations, selectedThreads, toggleThread, pushAction, openEmail }: { conversations: Conversation[]; selectedThreads: string[]; toggleThread: (id: string) => void; pushAction: (v: string) => void; openEmail: (id: string) => void }) {
  return (
    <>
      <Panel title="Super Inbox execution floor" icon={Inbox} desc="Multi-mailbox triage designed for company operations: select, bulk assign, archive, tag, resolve, escalate and link each thread to business context." actions={<><ActionButton icon={UserCheck} onClick={() => pushAction('Bulk assign: ' + selectedThreads.join(', '))}>Bulk assign ({selectedThreads.length})</ActionButton><ActionButton icon={Archive} tone="amber" onClick={() => pushAction('Bulk archive: ' + selectedThreads.join(', '))}>Archive</ActionButton><ActionButton icon={CheckCircle2} tone="emerald" onClick={() => pushAction('Bulk resolve: ' + selectedThreads.join(', '))}>Resolve</ActionButton></>}>
        <div className="grid gap-3">
          {conversations.map(c => (
            <div key={c.id} className={cx('rounded-3xl border p-4 transition', selectedThreads.includes(c.id) ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-slate-700/80 bg-[#08111f]')}>
              <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                <input aria-label={'select ' + c.id} type="checkbox" checked={selectedThreads.includes(c.id)} onChange={() => toggleThread(c.id)} className="mt-2 h-5 w-5 accent-cyan-300" />
                <div>
                  <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => openEmail(c.id)} className="text-left text-lg font-black text-white underline-offset-4 hover:text-cyan-200 hover:underline">{c.subject}</button><StatusPill value={c.priority} /><StatusPill value={c.status} /></div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{c.lastMessage}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">{[c.mailbox, c.owner, c.department, c.sla, c.revenueLink, ...c.tags].map(tag => <span key={tag} className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-slate-300">{tag}</span>)}</div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end"><ActionButton icon={Eye} onClick={() => openEmail(c.id)}>Open email</ActionButton><ActionButton icon={Reply} onClick={() => { openEmail(c.id); pushAction('Reply started for ' + c.id); }}>Reply</ActionButton><ActionButton icon={Link2} tone="emerald" onClick={() => pushAction('Linked ' + c.id + ' to ' + c.revenueLink)}>Link</ActionButton><ActionButton icon={Bell} tone="rose" onClick={() => pushAction('Escalated ' + c.id)}>Escalate</ActionButton></div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Saved operational views" icon={Filter} desc="Views are not decorations: each one matches a real management workflow for a company email team.">
        <div className="grid gap-3 md:grid-cols-2">{savedViews.map(v => <div key={v.name} className="rounded-3xl border border-slate-700/80 bg-[#08111f] p-4"><h4 className="font-black text-white">{v.name}</h4><p className="mt-2 text-sm text-slate-300">{v.useCase}</p><code className="mt-3 block rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-cyan-200">{v.logic}</code><div className="mt-3 text-xs text-slate-400">Owner: {v.owner} · Applies to: {v.appliesTo}</div></div>)}</div>
      </Panel>
    </>
  );
}

function ThreadDossiers({ conversations, selectedThreads, toggleThread, pushAction, openEmail }: { conversations: Conversation[]; selectedThreads: string[]; toggleThread: (id: string) => void; pushAction: (v: string) => void; openEmail: (id: string) => void }) {
  const active = conversations.find(c => selectedThreads.includes(c.id)) || conversations[0];
  return (
    <Panel title="Thread dossier and decision timeline" icon={MessageSquare} desc="A real email operation needs context: participants, linked records, notes, attachments, decisions, next actions and audit state.">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="space-y-3">{conversations.map(c => <button key={c.id} type="button" onClick={() => toggleThread(c.id)} className={cx('w-full rounded-3xl border p-4 text-left transition', active.id === c.id ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-slate-700/80 bg-[#08111f] hover:border-cyan-300/40')}><div className="font-black text-white">{c.subject}</div><div className="mt-1 text-sm text-slate-400">{c.from} · {c.mailbox}</div><div className="mt-2 flex gap-2"><StatusPill value={c.priority} /><StatusPill value={c.status} /></div></button>)}</div>
        <div className="rounded-[2rem] border border-slate-700/80 bg-[#08111f] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-2xl font-black text-white">{active.subject}</h3><p className="mt-1 text-sm text-slate-400">{active.id} · {active.from} · {active.client}</p></div><div className="flex flex-wrap gap-2"><StatusPill value={active.priority} /><ActionButton icon={Eye} onClick={() => openEmail(active.id)}>Open email reader</ActionButton></div></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2"><DataRow icon={Briefcase} left="Revenue context" middle={active.revenueLink} right={<ActionButton icon={Link2} onClick={() => pushAction('Revenue context opened for ' + active.id)}>Open</ActionButton>} /><DataRow icon={Building2} left="Partner/client context" middle={active.partnerLink} right={<ActionButton icon={Eye}>View</ActionButton>} /><DataRow icon={UserCheck} left="Owner" middle={active.owner} right={<ActionButton icon={UserCog}>Assign</ActionButton>} /><DataRow icon={Timer} left="SLA" middle={active.sla} right={<ActionButton icon={Bell} tone="rose">Escalate</ActionButton>} /></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2"><div><h4 className="mb-3 font-black text-white">Conversation timeline</h4><MiniTimeline items={[active.lastMessage, ...active.notes, 'Decision required: choose reply, escalation or linked task.', 'Audit trail will record owner/action once executed.']} /></div><div><h4 className="mb-3 font-black text-white">Internal command actions</h4><div className="space-y-2">{['Add internal note', 'Create follow-up task', 'Attach proof file', 'Mark waiting client', 'Mark resolved', 'Export thread audit'].map(action => <ActionButton key={action} icon={Command} onClick={() => pushAction(action + ' · ' + active.id)}>{action}</ActionButton>)}</div></div></div>
        </div>
      </div>
    </Panel>
  );
}


function EmailReaderDrawer({ conversation, open, onClose, onReply, onResolve, onArchive, onEscalate, onCreateTask }: { conversation?: Conversation; open: boolean; onClose: () => void; onReply: () => void; onResolve: () => void; onArchive: () => void; onEscalate: () => void; onCreateTask: () => void }) {
  if (!open || !conversation) return null;

  const simulatedMessages = [
    {
      from: conversation.from,
      role: 'External sender',
      time: 'Today · 09:18',
      body: conversation.lastMessage,
    },
    {
      from: conversation.owner,
      role: 'Internal owner',
      time: 'Today · 09:32',
      body: conversation.notes[0] || 'Internal team reviewed the message and prepared the next step.',
    },
    {
      from: 'AngelCare Email OS',
      role: 'System context',
      time: 'Now',
      body: `Business context linked: ${conversation.revenueLink}. SLA: ${conversation.sla}. Priority: ${conversation.priority}.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <button type="button" aria-label="Close email reader overlay" onClick={onClose} className="absolute inset-0 cursor-default" />
      <section className="relative h-full w-full max-w-4xl overflow-y-auto border-l border-cyan-300/30 bg-slate-950 p-5 shadow-2xl shadow-black md:p-8">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-slate-700/80 bg-slate-950/95 px-5 py-4 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">Email reader</p>
              <h2 className="mt-2 text-2xl font-black text-white md:text-4xl">{conversation.subject}</h2>
              <p className="mt-2 text-sm text-slate-400">{conversation.id} · From {conversation.from} · {conversation.mailbox} mailbox · Owner {conversation.owner}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={Reply} onClick={onReply}>Reply</ActionButton>
              <ActionButton icon={CheckCircle2} tone="emerald" onClick={onResolve}>Resolve</ActionButton>
              <ActionButton icon={Archive} tone="amber" onClick={onArchive}>Archive</ActionButton>
              <ActionButton icon={Bell} tone="rose" onClick={onEscalate}>Escalate</ActionButton>
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-black text-slate-100 hover:bg-slate-800">Close</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <MetricCard label="Priority" value={conversation.priority} icon={AlertTriangle} helper="Reader-level priority context." tone={conversation.priority === 'Critical' ? 'rose' : conversation.priority === 'High' ? 'amber' : 'cyan'} />
          <MetricCard label="SLA" value={conversation.sla} icon={Timer} helper="Time pressure visible before action." tone="amber" />
          <MetricCard label="Status" value={conversation.status} icon={MailCheck} helper="Current operational state." tone={conversation.status === 'Resolved' ? 'emerald' : 'cyan'} />
          <MetricCard label="Client" value={conversation.client.split(' ')[0] || 'Client'} icon={Building2} helper={conversation.client} tone="violet" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {simulatedMessages.map((message) => (
              <article key={message.time + message.from} className="rounded-[2rem] border border-slate-700/80 bg-[#08111f] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{message.from}</h3>
                    <p className="text-xs text-slate-400">{message.role} · {message.time}</p>
                  </div>
                  <StatusPill value={conversation.status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{message.body}</p>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <Panel title="Business context" icon={Briefcase} desc="The reader must show what this email is connected to before the user decides." actions={<ActionButton icon={Link2} onClick={onCreateTask}>Create follow-up</ActionButton>}>
              <div className="space-y-3">
                <DataRow icon={Briefcase} left="Revenue link" middle={conversation.revenueLink} right={<StatusPill value="Linked" />} />
                <DataRow icon={Building2} left="Partner/client link" middle={conversation.partnerLink} right={<StatusPill value="Linked" />} />
                <DataRow icon={UserCheck} left="Owner" middle={conversation.owner} right={<ActionButton icon={UserCog}>Assign</ActionButton>} />
                <DataRow icon={ShieldCheck} left="Department" middle={conversation.department} right={<StatusPill value={conversation.mailbox} />} />
              </div>
            </Panel>

            <Panel title="Tags and notes" icon={Tag} desc="Notes and classification must be visible inside the opened email.">
              <div className="flex flex-wrap gap-2">
                {[conversation.mailbox, conversation.department, ...conversation.tags].map(tag => <span key={tag} className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200">{tag}</span>)}
              </div>
              <div className="mt-4 space-y-2">
                {conversation.notes.map(note => <div key={note} className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300">{note}</div>)}
              </div>
            </Panel>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ComposerStudio({ draft, selectedConversationObjects }: { draft: ReturnType<typeof useEmailOsDraftState>; selectedConversationObjects: Conversation[] }) {
  return (
    <Panel title="Composer Studio with governance" icon={Send} desc="Professional composing means identity, template, approval, variables, preview, queue, audit and restriction checks — not just a textarea." actions={<><ActionButton icon={Save} onClick={() => draft.pushAction('Draft saved locally')}>Save draft</ActionButton><ActionButton icon={Send} tone="emerald" onClick={() => draft.pushAction('Send queued for approval/delivery')}>Queue send</ActionButton></>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Sending mailbox</span><select className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">{mailboxes.map(m => <option key={m.id}>{m.name} · {m.address}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Template</span><select value={draft.selectedTemplate} onChange={(e) => draft.setSelectedTemplate(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">{templates.map(t => <option key={t.name}>{t.name}</option>)}</select></label></div>
          <label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Subject</span><input value={draft.draftSubject} onChange={(e) => draft.setDraftSubject(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100" /></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Body</span><textarea value={draft.draftBody} onChange={(e) => draft.setDraftBody(e.target.value)} rows={12} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100" /></label>
          <div className="grid gap-3 md:grid-cols-3"><ActionButton icon={Paperclip} tone="slate">Attach</ActionButton><ActionButton icon={Wand2} tone="cyan" onClick={() => draft.pushAction('AI quality assistant reviewed draft')}>Improve</ActionButton><ActionButton icon={BadgeCheck} tone="emerald" onClick={() => draft.pushAction('Approval requested for draft')}>Approval</ActionButton></div>
        </div>
        <div className="space-y-4"><div className="rounded-[2rem] border border-slate-700 bg-[#08111f] p-5"><h4 className="font-black text-white">Live preview</h4><div className="mt-4 rounded-2xl bg-white p-5 text-slate-950"><div className="text-xs text-slate-500">Subject</div><div className="font-black">{draft.draftSubject}</div><hr className="my-4" /><pre className="whitespace-pre-wrap font-sans text-sm leading-6">{draft.draftBody}</pre></div></div><div className="rounded-[2rem] border border-amber-400/30 bg-amber-400/10 p-5"><h4 className="font-black text-white">Governance checks</h4><div className="mt-3 space-y-2">{['Mailbox identity selected', 'Template variables detected', 'Restricted legal mailbox blocked unless approved', 'Audit record prepared', 'Queue endpoint ready'].map(x => <DataRow key={x} icon={ShieldCheck} left={x} right={<StatusPill value="Ready" />} />)}</div></div>{selectedConversationObjects.length ? <div className="rounded-[2rem] border border-cyan-400/30 bg-cyan-400/10 p-5"><h4 className="font-black text-white">Linked selected thread</h4>{selectedConversationObjects.map(c => <p key={c.id} className="mt-2 text-sm text-cyan-100">{c.id} · {c.subject}</p>)}</div> : null}</div>
      </div>
    </Panel>
  );
}

function AccessMatrix({ pushAction }: { pushAction: (v: string) => void }) {
  return <Panel title="CEO-grade access matrix" icon={UserCog} desc="Control read, send, approve and admin rights by user, mailbox and department. This is mandatory for corporate email governance."><div className="overflow-hidden rounded-3xl border border-slate-700/80"><div className="grid grid-cols-7 gap-px bg-slate-700 text-xs font-black uppercase tracking-widest text-slate-300"><div className="bg-slate-950 p-3">User</div><div className="bg-slate-950 p-3">Mailbox</div><div className="bg-slate-950 p-3">Read</div><div className="bg-slate-950 p-3">Send</div><div className="bg-slate-950 p-3">Approve</div><div className="bg-slate-950 p-3">Admin</div><div className="bg-slate-950 p-3">Action</div></div>{permissions.map(p => <div key={p.user + p.mailbox} className="grid grid-cols-7 gap-px bg-slate-800 text-sm text-slate-200"><div className="bg-[#08111f] p-3"><div className="font-bold text-white">{p.user}</div><div className="text-xs text-slate-400">{p.role} · {p.department}</div></div><div className="bg-[#08111f] p-3">{p.mailbox}</div>{[p.read,p.send,p.approve,p.admin].map((v,i)=><div key={i} className="bg-[#08111f] p-3">{v ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Lock className="h-5 w-5 text-rose-300" />}</div>)}<div className="bg-[#08111f] p-3"><ActionButton icon={KeyRound} onClick={() => pushAction('Access updated for ' + p.user)}>Edit</ActionButton></div></div>)}</div></Panel>;
}

function EngineCenter({ pushAction }: { pushAction: (v: string) => void }) {
  return <><Panel title="Engine monitoring and queue control" icon={Server} desc="Control sync jobs, delivery retries, provider checks and queue health with clear operational outcomes." actions={<><ActionButton icon={RefreshCw} onClick={() => pushAction('Engine queue refreshed')}>Refresh queue</ActionButton><ActionButton icon={Zap} tone="emerald" onClick={() => pushAction('Retry failed jobs executed')}>Retry failed</ActionButton></>}><div className="grid gap-3">{queueJobs.map(j => <DataRow key={j.id} icon={Database} left={<><div className="font-black text-white">{j.job}</div><div className="text-xs text-slate-400">{j.id} · {j.owner}</div></>} middle={<><StatusPill value={j.state} /> <span className="ml-2">{j.mailbox} · retry {j.retry}</span><div className="mt-1 text-xs text-slate-400">{j.impact}</div></>} right={<ActionButton icon={j.state === 'Failed' ? RefreshCw : Eye} tone={j.state === 'Failed' ? 'rose' : 'cyan'} onClick={() => pushAction((j.state === 'Failed' ? 'Retry ' : 'Inspect ') + j.id)}>{j.state === 'Failed' ? 'Retry' : 'Inspect'}</ActionButton>} />)}</div></Panel><Panel title="Provider readiness" icon={Globe} desc="This area is where real provider credentials are verified after environment variables are configured."><div className="grid gap-3 md:grid-cols-2">{mailboxes.map(m => <div key={m.id} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-black text-white">{m.name}</h4><p className="mt-1 text-sm text-slate-400">{m.provider} · {m.address}</p></div><StatusPill value={m.status} /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-slate-950 p-3"><div className="text-lg font-black text-white">{m.inbound}</div><div className="text-xs text-slate-500">in</div></div><div className="rounded-2xl bg-slate-950 p-3"><div className="text-lg font-black text-white">{m.outbound}</div><div className="text-xs text-slate-500">out</div></div><div className="rounded-2xl bg-slate-950 p-3"><div className="text-lg font-black text-white">{m.slaRisk}</div><div className="text-xs text-slate-500">risk</div></div></div></div>)}</div></Panel></>;
}

function AnalyticsCenter() {
  const totalInbound = mailboxes.reduce((s, m) => s + m.inbound, 0);
  const totalOutbound = mailboxes.reduce((s, m) => s + m.outbound, 0);
  return <><Panel title="Communication analytics board" icon={BarChart3} desc="Volume, response health, workload, SLA and infrastructure failure intelligence."><div className="grid gap-4 md:grid-cols-4"><MetricCard label="Inbound volume" value={String(totalInbound)} icon={Inbox} helper="Across all configured company mailboxes." /><MetricCard label="Outbound volume" value={String(totalOutbound)} icon={Send} helper="Controlled outbound messages and replies." tone="emerald" /><MetricCard label="Open workload" value={String(mailboxes.reduce((s,m)=>s+m.unresolved,0))} icon={Layers} helper="Unresolved communication workload." tone="amber" /><MetricCard label="Failure exposure" value={String(queueJobs.filter(j=>j.state==='Failed').length)} icon={AlertTriangle} helper="Infrastructure jobs requiring attention." tone="rose" /></div></Panel><Panel title="Mailbox performance by department" icon={TrendingUp}><div className="space-y-3">{mailboxes.map(m => <div key={m.id} className="rounded-2xl border border-slate-700 bg-[#08111f] p-4"><div className="flex flex-wrap justify-between gap-3"><div><h4 className="font-black text-white">{m.name}</h4><p className="text-sm text-slate-400">{m.department} · {m.owner}</p></div><StatusPill value={m.status} /></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-950"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, Math.round((m.inbound / 240) * 100))}%` }} /></div><div className="mt-2 text-xs text-slate-400">{m.inbound} inbound · {m.outbound} outbound · {m.unresolved} unresolved · {m.slaRisk} SLA risk</div></div>)}</div></Panel></>;
}

function ConfigurationCenter({ pushAction }: { pushAction: (v: string) => void }) {
  const [provider, setProvider] = useState('Google Workspace');
  const [host, setHost] = useState('imap.gmail.com');
  const [smtp, setSmtp] = useState('smtp.gmail.com');
  const [signature, setSignature] = useState('Best regards,\nAngelCare Team');
  return <><Panel title="Email service configuration center" icon={Settings} desc="This is the serious configuration layer: providers, SMTP/IMAP, OAuth, mailboxes, signatures, routing, access and automation rules." actions={<><ActionButton icon={Save} tone="emerald" onClick={() => { try { localStorage.setItem('angelcare-email-os-v12-config', JSON.stringify({provider,host,smtp,signature})); } catch {}; pushAction('Configuration saved locally and ready for backend binding'); }}>Save configuration</ActionButton><ActionButton icon={RefreshCw} onClick={() => pushAction('Provider connection test requested')}>Test connection</ActionButton></>}><div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><div className="space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Provider</span><select value={provider} onChange={(e)=>setProvider(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"><option>Google Workspace</option><option>Microsoft 365</option><option>SMTP/IMAP</option><option>Shared Alias</option></select></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">IMAP / inbound host</span><input value={host} onChange={(e)=>setHost(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">SMTP / outbound host</span><input value={smtp} onChange={(e)=>setSmtp(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-200">Default signature</span><textarea value={signature} onChange={(e)=>setSignature(e.target.value)} rows={5} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100" /></label></div><div className="grid gap-3">{configurationSections.map(s => <div key={s.title} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="flex items-center gap-3"><s.icon className="h-5 w-5 text-cyan-200" /><h4 className="font-black text-white">{s.title}</h4></div><div className="mt-3 flex flex-wrap gap-2">{s.fields.map(f => <span key={f} className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-xs text-slate-300">{f}</span>)}</div></div>)}</div></div></Panel><MailboxRegistry pushAction={pushAction} /></>;
}

function MailboxRegistry({ pushAction }: { pushAction: (v: string) => void }) {
  return <Panel title="Mailbox registry and ownership" icon={Mail} desc="Every mailbox has a department owner, provider, health state, routing rule and signature policy."><div className="grid gap-3">{mailboxes.map(m => <DataRow key={m.id} icon={AtSign} left={<><div className="font-black text-white">{m.name}</div><div className="text-xs text-slate-400">{m.address}</div></>} middle={<><StatusPill value={m.status} /> <span className="ml-2">{m.provider} · {m.department} · owner: {m.owner}</span><div className="mt-1 text-xs text-slate-400">Rule: {m.routingRule}</div></>} right={<ActionButton icon={SlidersHorizontal} onClick={() => pushAction('Mailbox settings opened for ' + m.name)}>Configure</ActionButton>} />)}</div></Panel>;
}

function TemplateCenter({ draft }: { draft: ReturnType<typeof useEmailOsDraftState> }) {
  return <Panel title="Template and reply quality center" icon={FileText} desc="Templates are organized by business context with variables, approval requirements and quality scoring."><div className="grid gap-3 md:grid-cols-2">{templates.map(t => <div key={t.name} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><div className="flex justify-between gap-3"><div><h4 className="font-black text-white">{t.name}</h4><p className="mt-1 text-sm text-slate-400">{t.category} · {t.approval}</p></div><div className="text-2xl font-black text-white">{t.quality}%</div></div><div className="mt-3 flex flex-wrap gap-2">{t.variables.map(v => <span key={v} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">{v}</span>)}</div><div className="mt-4"><ActionButton icon={Wand2} onClick={() => { draft.setSelectedTemplate(t.name); draft.pushAction('Template selected: ' + t.name); }}>Use template</ActionButton></div></div>)}</div></Panel>;
}

function AutomationCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Automation and escalation rules" icon={Workflow} desc="Rules turn email signals into operational actions: assignment, escalation, follow-up, blocking, retry and notifications."><div className="grid gap-3">{automationRules.map(rule => <DataRow key={rule.name} icon={Workflow} left={<><div className="font-black text-white">{rule.name}</div><div className="text-xs text-slate-400">Trigger: {rule.trigger}</div></>} middle={<><StatusPill value={rule.status} /> <span className="ml-2">{rule.action}</span><div className="mt-1 text-xs text-slate-400">Risk category: {rule.risk}</div></>} right={<ActionButton icon={SlidersHorizontal} onClick={() => pushAction('Automation edited: ' + rule.name)}>Edit</ActionButton>} />)}</div></Panel>; }
function AuditCenter() { return <Panel title="Audit trail and compliance history" icon={History} desc="Every serious company email system needs traceable actions."><div className="grid gap-3">{auditRows.map(r => <DataRow key={r.time + r.action} icon={History} left={<><div className="font-black text-white">{r.action}</div><div className="text-xs text-slate-400">{r.time} · {r.actor}</div></>} middle={r.target} right={<StatusPill value={r.result} />} />)}</div></Panel>; }
function ApprovalCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Approval queue" icon={BadgeCheck} desc="Restricted, legal, CEO and high-risk outbound emails can be reviewed before sending."><div className="grid gap-3">{conversations.filter(c => ['Critical','High'].includes(c.priority)).map(c => <DataRow key={c.id} icon={ShieldCheck} left={<><div className="font-black text-white">Approval needed: {c.subject}</div><div className="text-xs text-slate-400">{c.mailbox} · {c.owner}</div></>} middle={<StatusPill value={c.priority} />} right={<><ActionButton icon={CheckCircle2} tone="emerald" onClick={() => pushAction('Approved ' + c.id)}>Approve</ActionButton></>} />)}</div></Panel>; }
function AttachmentCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Attachments and files intake" icon={Paperclip} desc="Control attachments, proofs, invoices, candidate documents and legal files from email threads."><div className="grid gap-3 md:grid-cols-2">{['Invoice proof bundle', 'Caregiver candidate documents', 'Legal contract draft', 'Training proposal PDF', 'Family schedule screenshot', 'SMTP error export'].map(file => <div key={file} className="rounded-3xl border border-slate-700 bg-[#08111f] p-4"><FileArchive className="h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-black text-white">{file}</h4><p className="mt-2 text-sm text-slate-400">Ready to classify, attach to context, archive or export.</p><div className="mt-4"><ActionButton icon={FileCheck2} onClick={() => pushAction('Attachment processed: ' + file)}>Process</ActionButton></div></div>)}</div></Panel>; }
function SyncCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Mailbox sync command" icon={RefreshCw} desc="Run, pause and inspect sync operations across company mailboxes."><div className="grid gap-3">{queueJobs.filter(j => j.job.toLowerCase().includes('sync') || j.job.toLowerCase().includes('classify') || j.job.toLowerCase().includes('credential')).map(j => <DataRow key={j.id} icon={RefreshCw} left={j.job} middle={<StatusPill value={j.state} />} right={<ActionButton icon={PlayIcon} onClick={() => pushAction('Sync command executed: ' + j.id)}>Run</ActionButton>} />)}</div></Panel>; }
function PlayIcon({ className }: { className?: string }) { return <Zap className={className} />; }
function OutboxCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Outbox queue and delivery control" icon={Send} desc="Scheduled sends, failed sends, pending approvals and delivery retries."><div className="grid gap-3">{queueJobs.map(j => <DataRow key={j.id} icon={Send} left={'Outbound job · ' + j.job} middle={<StatusPill value={j.state} />} right={<ActionButton icon={RefreshCw} onClick={() => pushAction('Outbox inspected: ' + j.id)}>Inspect</ActionButton>} />)}</div></Panel>; }
function FileCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Email file intelligence" icon={HardDrive} desc="Documents extracted from threads, ready to link to clients, invoices, HR records and contracts."><div className="grid gap-3 md:grid-cols-2">{['Client communication proof', 'Contract attachment history', 'Invoice dispute documents', 'Candidate verification files'].map(x => <div key={x} className="rounded-3xl border border-slate-700 bg-[#08111f] p-5"><FileText className="h-7 w-7 text-cyan-200" /><h4 className="mt-3 font-black text-white">{x}</h4><p className="mt-2 text-sm text-slate-400">Categorize and link files to operational records.</p><div className="mt-4"><ActionButton icon={Link2} onClick={() => pushAction('File linked: ' + x)}>Link file</ActionButton></div></div>)}</div></Panel>; }
function FollowUpCenter({ pushAction }: { pushAction: (v: string) => void }) { return <Panel title="Follow-up command center" icon={CalendarClock} desc="Turn emails into controlled follow-ups with owners, deadlines and context."><div className="grid gap-3">{conversations.slice(0,6).map(c => <DataRow key={c.id} icon={CalendarClock} left={<><div className="font-black text-white">{c.subject}</div><div className="text-xs text-slate-400">Suggested follow-up owner: {c.owner}</div></>} middle={c.sla} right={<ActionButton icon={Plus} onClick={() => pushAction('Follow-up created for ' + c.id)}>Create</ActionButton>} />)}</div></Panel>; }


export const emailOsV12ProductionReadinessMatrix = [
  { step: 1, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 2, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 3, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 4, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 5, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 6, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 7, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 8, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 9, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 10, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 11, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 12, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 13, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 14, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 15, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 16, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 17, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 18, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 19, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 20, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 21, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 22, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 23, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 24, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 25, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 26, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 27, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 28, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 29, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 30, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 31, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 32, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 33, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 34, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 35, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 36, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 37, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 38, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 39, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 40, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 41, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 42, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 43, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 44, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 45, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 46, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 47, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 48, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 49, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 50, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 51, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 52, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 53, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 54, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 55, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 56, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 57, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 58, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 59, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 60, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 61, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 62, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 63, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 64, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 65, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 66, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 67, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 68, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 69, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 70, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 71, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 72, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 73, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 74, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 75, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 76, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 77, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 78, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 79, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 80, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 81, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 82, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 83, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 84, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 85, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 86, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 87, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 88, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 89, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 90, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 91, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 92, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 93, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 94, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 95, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 96, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 97, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 98, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 99, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 100, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 101, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 102, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 103, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 104, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 105, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 106, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 107, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 108, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 109, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 110, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 111, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 112, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 113, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 114, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 115, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 116, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 117, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 118, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 119, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 120, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 121, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 122, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 123, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 124, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 125, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 126, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 127, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 128, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 129, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 130, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 131, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 132, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 133, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 134, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 135, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 136, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 137, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 138, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 139, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 140, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 141, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 142, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 143, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 144, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 145, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 146, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 147, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 148, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 149, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 150, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 151, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 152, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 153, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 154, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 155, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 156, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 157, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 158, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 159, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 160, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 161, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 162, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 163, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 164, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 165, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 166, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 167, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 168, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 169, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 170, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 171, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 172, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 173, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 174, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 175, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 176, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 177, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 178, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 179, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 180, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 181, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 182, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 183, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 184, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 185, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 186, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 187, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 188, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 189, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 190, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 191, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 192, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 193, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 194, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 195, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 196, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 197, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 198, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 199, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 200, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 201, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 202, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 203, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 204, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 205, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 206, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 207, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 208, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 209, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 210, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 211, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 212, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 213, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 214, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 215, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 216, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 217, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 218, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 219, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 220, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 221, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 222, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 223, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 224, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 225, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 226, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 227, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 228, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 229, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 230, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 231, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 232, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 233, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 234, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 235, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 236, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 237, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 238, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 239, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 240, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 241, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 242, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 243, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 244, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 245, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 246, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 247, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 248, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 249, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 250, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 251, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 252, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 253, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 254, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 255, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 256, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 257, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 258, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 259, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 260, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
  { step: 261, area: 'Email OS production readiness', control: 'Provider OAuth connection validated', owner: 'Operations', status: 'Configured' },
  { step: 262, area: 'Email OS production readiness', control: 'IMAP inbound sync policy defined', owner: 'Billing', status: 'Needs credentials' },
  { step: 263, area: 'Email OS production readiness', control: 'SMTP outbound policy defined', owner: 'HR', status: 'Guarded' },
  { step: 264, area: 'Email OS production readiness', control: 'Mailbox owner assigned', owner: 'Marketing', status: 'Ready' },
  { step: 265, area: 'Email OS production readiness', control: 'Restricted mailbox access reviewed', owner: 'Sales', status: 'Configured' },
  { step: 266, area: 'Email OS production readiness', control: 'Default signature attached', owner: 'Academy', status: 'Needs credentials' },
  { step: 267, area: 'Email OS production readiness', control: 'Department routing rule verified', owner: 'Legal', status: 'Guarded' },
  { step: 268, area: 'Email OS production readiness', control: 'SLA category mapped', owner: 'Engine', status: 'Ready' },
  { step: 269, area: 'Email OS production readiness', control: 'Saved view available', owner: 'Care', status: 'Configured' },
  { step: 270, area: 'Email OS production readiness', control: 'Audit retention policy visible', owner: 'CEO Office', status: 'Needs credentials' },
  { step: 271, area: 'Email OS production readiness', control: 'Bulk assignment workflow available', owner: 'Operations', status: 'Guarded' },
  { step: 272, area: 'Email OS production readiness', control: 'Follow-up creation workflow available', owner: 'Billing', status: 'Ready' },
  { step: 273, area: 'Email OS production readiness', control: 'Revenue link workflow available', owner: 'HR', status: 'Configured' },
  { step: 274, area: 'Email OS production readiness', control: 'Partner link workflow available', owner: 'Marketing', status: 'Needs credentials' },
  { step: 275, area: 'Email OS production readiness', control: 'Client proof attachment workflow available', owner: 'Sales', status: 'Guarded' },
  { step: 276, area: 'Email OS production readiness', control: 'Queue retry workflow available', owner: 'Academy', status: 'Ready' },
  { step: 277, area: 'Email OS production readiness', control: 'Failed send inspection workflow available', owner: 'Legal', status: 'Configured' },
  { step: 278, area: 'Email OS production readiness', control: 'Approval gate workflow available', owner: 'Engine', status: 'Needs credentials' },
  { step: 279, area: 'Email OS production readiness', control: 'Template variable review available', owner: 'Care', status: 'Guarded' },
  { step: 280, area: 'Email OS production readiness', control: 'Local persistence validation available', owner: 'CEO Office', status: 'Ready' },
] as const;

export default EmailOSV12Shell;

