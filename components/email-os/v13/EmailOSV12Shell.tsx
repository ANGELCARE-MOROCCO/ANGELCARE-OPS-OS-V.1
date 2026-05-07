'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Command,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Gauge,
  Inbox,
  KeyRound,
  Link2,
  Lock,
  Mail,
  MailCheck,
  MessageSquare,
  Network,
  Paperclip,
  PauseCircle,
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
  Sparkles,
  Tag,
  Target,
  Timer,
  Trash2,
  UserCheck,
  UserCog,
  Wand2,
  Workflow,
  X,
  Zap,
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
type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';

type Mailbox = {
  id: string;
  name: string;
  address: string;
  department: string;
  owner: string;
  provider: 'Menara SMTP/IMAP' | 'Google Workspace' | 'Microsoft 365' | 'Shared Alias';
  status: 'Connected' | 'Needs setup' | 'Warning' | 'Restricted';
  inbound: number;
  outbound: number;
  unresolved: number;
  slaRisk: number;
  sendEnabled: boolean;
  receiveEnabled: boolean;
  signature: string;
  routingRule: string;
};

type Conversation = {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  mailbox: string;
  owner: string;
  department: string;
  status: 'Unassigned' | 'Assigned' | 'Waiting client' | 'Waiting internal' | 'Resolved' | 'Escalated' | 'Archived';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  sla: string;
  revenueLink: string;
  partnerLink: string;
  client: string;
  tags: string[];
  lastMessage: string;
  body: string;
  notes: string[];
  attachments: string[];
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

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  approval: string;
  body: string;
  quality: number;
};

type Draft = {
  id: string;
  mailbox: string;
  to: string;
  subject: string;
  body: string;
  status: 'Draft' | 'Approval required' | 'Queued' | 'Sent blocked';
  linkedThread?: string;
};

type Permission = {
  id: string;
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

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'Active' | 'Paused' | 'Draft';
  risk: string;
};

type AppState = {
  mailboxes: Mailbox[];
  conversations: Conversation[];
  queueJobs: QueueJob[];
  templates: Template[];
  drafts: Draft[];
  permissions: Permission[];
  automations: AutomationRule[];
  audit: string[];
  config: {
    providerMode: string;
    imapHost: string;
    imapPort: string;
    smtpHost: string;
    smtpPort: string;
    defaultSla: string;
    approvalPolicy: string;
  };
};

const nav: Array<{ label: string; href: string; mode: V12Mode; icon: LucideIcon; tag: string; desc: string }> = [
  { label: 'Command 360', href: '/email-os/v12', mode: 'command', icon: Command, tag: 'HQ', desc: 'Executive monitor dashboard and action center' },
  { label: 'Super Inbox', href: '/email-os/inbox/v12', mode: 'inbox', icon: Inbox, tag: 'OPS', desc: 'Open, read, select, assign, resolve and archive emails' },
  { label: 'Thread Dossiers', href: '/email-os/threads/v12', mode: 'threads', icon: MessageSquare, tag: 'CTX', desc: 'Conversation timeline, context, notes and follow-ups' },
  { label: 'Composer Studio', href: '/email-os/composer/v12', mode: 'composer', icon: Send, tag: 'SEND', desc: 'Draft, preview, approve and queue outbound messages' },
  { label: 'Access Matrix', href: '/email-os/access/v12', mode: 'access', icon: UserCog, tag: 'CEO', desc: 'Read/send/approve/admin permissions' },
  { label: 'Engine Center', href: '/email-os/engine/v12', mode: 'engine', icon: Server, tag: 'RUN', desc: 'Sync jobs, retry queue and delivery controls' },
  { label: 'Analytics', href: '/email-os/analytics/v12', mode: 'analytics', icon: BarChart3, tag: 'BI', desc: 'Workload, SLA, provider and mailbox intelligence' },
  { label: 'Configuration', href: '/email-os/configuration/v12', mode: 'configuration', icon: Settings, tag: 'CFG', desc: 'Menara SMTP/IMAP, rules, signatures and policies' },
  { label: 'Mailboxes', href: '/email-os/mailboxes/v12', mode: 'mailboxes', icon: Mail, tag: 'BOX', desc: 'Create, edit, enable, disable and inspect mailboxes' },
  { label: 'Templates', href: '/email-os/templates/v12', mode: 'templates', icon: FileText, tag: 'TPL', desc: 'Reply templates and approval requirements' },
  { label: 'Automation', href: '/email-os/automation/v12', mode: 'automation', icon: Workflow, tag: 'AUTO', desc: 'Rules, escalations and routing triggers' },
  { label: 'Approvals', href: '/email-os/approvals/v12', mode: 'approvals', icon: BadgeCheck, tag: 'APP', desc: 'Approve drafts and governed sends' },
  { label: 'Outbox', href: '/email-os/outbox/v12', mode: 'outbox', icon: Send, tag: 'OUT', desc: 'Queued messages and blocked delivery' },
  { label: 'Audit', href: '/email-os/audit/v12', mode: 'audit', icon: Shield, tag: 'LOG', desc: 'Full execution history' },
];

const initialState: AppState = {
  mailboxes: [
    { id: 'mbx-supports', name: 'Supports', address: 'supports@angelcare.ma', department: 'Support', owner: 'Support Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Support', routingRule: 'General support inbox and client issue routing' },
    { id: 'mbx-ops', name: 'Operations', address: 'ops@angelcare.ma', department: 'Operations', owner: 'Operations Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Operations', routingRule: 'Operations, missions, schedules and execution escalations' },
    { id: 'mbx-rh', name: 'RH', address: 'rh@angelcare.ma', department: 'HR', owner: 'HR Manager', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare RH', routingRule: 'HR, staff, caregivers, recruitment and internal notices' },
    { id: 'mbx-commercial', name: 'Commercial', address: 'Commercial@angelcare.ma', department: 'Commercial', owner: 'Commercial Director', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Commercial', routingRule: 'Sales, proposals, quotes and revenue communication' },
    { id: 'mbx-academy', name: 'Academy', address: 'Academy@angelcare.ma', department: 'Academy', owner: 'Academy Manager', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Academy', routingRule: 'Training center, trainees, trainers and certificates' },
    { id: 'mbx-montessori', name: 'Montessori', address: 'montessori@angelcare.ma', department: 'Academy', owner: 'Montessori Program Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Montessori', routingRule: 'Montessori training and education program inbox' },
    { id: 'mbx-flashcartes', name: 'Flashcartes', address: 'flashcartes@angelcare.ma', department: 'Academy', owner: 'Flashcartes Program Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Flashcartes', routingRule: 'Flashcartes program, orders, academy and learning communication' },
    { id: 'mbx-it-support', name: 'IT Support', address: 'it.support@angelcare.ma', department: 'IT', owner: 'IT Support', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare IT Support', routingRule: 'Technical support, access, devices and incident routing' },
    { id: 'mbx-homeservice', name: 'Home Service', address: 'Homeservice@angelcare.ma', department: 'Home Service', owner: 'Home Service Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Home Service', routingRule: 'Home service operations and client requests' },
    { id: 'mbx-events', name: 'Events', address: 'events@angelcare.ma', department: 'Events', owner: 'Events Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Events', routingRule: 'Events, bookings, confirmations and coordination' },
    { id: 'mbx-excursions', name: 'Excursions', address: 'exursions@angelcare.ma', department: 'Excursions', owner: 'Excursions Lead', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Excursions', routingRule: 'Excursions, logistics, participants and partners' },
    { id: 'mbx-b2b', name: 'B2B', address: 'b2b@angelcare.ma', department: 'B2B', owner: 'B2B Manager', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare B2B', routingRule: 'Corporate leads, enterprise offers and account follow-up' },
    { id: 'mbx-partenaires', name: 'Partenaires', address: 'partenaires@angelcare.ma', department: 'Partnerships', owner: 'Partnership Manager', provider: 'Menara SMTP/IMAP', status: 'Needs setup', inbound: 0, outbound: 0, unresolved: 0, slaRisk: 0, sendEnabled: true, receiveEnabled: true, signature: 'AngelCare Partenaires', routingRule: 'Partners, agreements, collaborations and relationship management' },
  ],
  conversations: [
    { id: 'THR-1001', subject: 'Urgent family care schedule change', from: 'Mme Benali', fromEmail: 'benali.family@example.com', mailbox: 'Family Support', owner: 'Care Experience', department: 'Care', status: 'Escalated', priority: 'Critical', sla: '12 min left', revenueLink: 'Contract AC-422', partnerLink: 'Care Plan CP-91', client: 'Benali Family', tags: ['schedule', 'caregiver', 'urgent'], lastMessage: 'Family requests immediate replacement for tomorrow morning visit.', body: 'Hello AngelCare,\n\nWe urgently need a replacement caregiver for tomorrow morning. Please confirm the schedule and who will come.\n\nRegards,\nMme Benali', notes: ['Escalated to operations', 'Caregiver backup needed'], attachments: ['care-plan.pdf'] },
    { id: 'THR-1002', subject: 'Invoice correction request for March services', from: 'Accounts Payable', fromEmail: 'ap@client.ma', mailbox: 'Billing', owner: 'Billing Manager', department: 'Finance', status: 'Waiting internal', priority: 'High', sla: '2h 15m', revenueLink: 'Invoice INV-2039', partnerLink: 'Client Ledger', client: 'Bennis Holding', tags: ['invoice', 'correction', 'finance'], lastMessage: 'The March invoice has a discrepancy on night shift hours.', body: 'Please verify invoice INV-2039. The night shift hours do not match our records.', notes: ['Need timesheet proof'], attachments: ['invoice-march.pdf'] },
    { id: 'THR-1003', subject: 'Corporate training proposal for caregivers', from: 'HR Director', fromEmail: 'hrdirector@casablanca-care.ma', mailbox: 'Sales', owner: 'Sales Director', department: 'Revenue', status: 'Assigned', priority: 'High', sla: '5h 30m', revenueLink: 'Opportunity OPP-774', partnerLink: 'Training Program TP-24', client: 'Casablanca Senior Care', tags: ['academy', 'proposal', 'B2B'], lastMessage: 'Client requested a detailed training calendar and price structure.', body: 'Can you send a detailed training calendar and a price structure for 25 caregivers?', notes: ['Prepare commercial PDF'], attachments: [] },
    { id: 'THR-1004', subject: 'Restricted legal contract review', from: 'Legal Counsel', fromEmail: 'legal@partner.ma', mailbox: 'Legal', owner: 'Legal Admin', department: 'Legal', status: 'Waiting internal', priority: 'High', sla: '6h 05m', revenueLink: 'Contract CTR-811', partnerLink: 'Partner Legal Folder', client: 'Health Partner SARL', tags: ['contract', 'restricted', 'partner'], lastMessage: 'Please verify liability wording before signature.', body: 'The liability wording in clause 8 needs review before signature.', notes: ['CEO access required'], attachments: ['contract-review.docx'] },
  ],
  queueJobs: [
    { id: 'JOB-001', job: 'Sync Operations inbox', mailbox: 'Operations', state: 'Queued', owner: 'Sync Engine', retry: 0, impact: 'Will sync Menara IMAP when credentials are connected' },
    { id: 'JOB-002', job: 'Retry failed Billing sends', mailbox: 'Billing', state: 'Failed', owner: 'Delivery Engine', retry: 2, impact: 'SMTP credentials not verified' },
    { id: 'JOB-003', job: 'Classify Family Support', mailbox: 'Family Support', state: 'Paused', owner: 'Routing Engine', retry: 0, impact: 'Waiting for provider test' },
  ],
  templates: [
    { id: 'TPL-001', name: 'Family schedule response', category: 'Care', subject: 'Re: Care schedule update', approval: 'No approval', quality: 94, body: 'Hello {{family_name}},\n\nWe are checking the schedule and will confirm the replacement caregiver shortly.\n\nBest regards,\nAngelCare' },
    { id: 'TPL-002', name: 'Invoice correction response', category: 'Billing', subject: 'Invoice correction review', approval: 'Finance approval', quality: 91, body: 'Hello,\n\nWe are reviewing the invoice correction request and will share supporting timesheet details.\n\nBest regards,\nAngelCare Billing' },
    { id: 'TPL-003', name: 'Legal acknowledgement', category: 'Legal', subject: 'Legal review acknowledgement', approval: 'CEO approval', quality: 97, body: 'Hello,\n\nWe received the legal document and will review internally before any formal response.\n\nBest regards,\nAngelCare' },
  ],
  drafts: [],
  permissions: [
    { id: 'PERM-001', user: 'CEO Office', role: 'Executive', department: 'Executive', mailbox: 'Legal', read: true, send: true, approve: true, admin: true, temporary: 'Permanent' },
    { id: 'PERM-002', user: 'Operations Lead', role: 'Manager', department: 'Operations', mailbox: 'Operations', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
    { id: 'PERM-003', user: 'Billing Manager', role: 'Manager', department: 'Finance', mailbox: 'Billing', read: true, send: true, approve: true, admin: false, temporary: 'Permanent' },
    { id: 'PERM-004', user: 'Legal Admin', role: 'Restricted', department: 'Legal', mailbox: 'Legal', read: true, send: false, approve: false, admin: false, temporary: 'Case-by-case' },
  ],
  automations: [
    { id: 'AUTO-001', name: 'Critical family escalation', trigger: 'priority=Critical AND mailbox=Family Support', action: 'Assign Operations Lead + notify CEO', status: 'Active', risk: 'High value' },
    { id: 'AUTO-002', name: 'SMTP failure guard', trigger: 'delivery_failed >= 2', action: 'Pause provider + move to retry queue', status: 'Active', risk: 'Infrastructure' },
    { id: 'AUTO-003', name: 'Legal restricted send', trigger: 'mailbox=Legal', action: 'Block send unless approved', status: 'Active', risk: 'Compliance' },
  ],
  audit: [],
  config: {
    providerMode: 'Menara SMTP/IMAP',
    imapHost: 'imap.menara.ma',
    imapPort: '993',
    smtpHost: 'smtp-auth.menara.ma',
    smtpPort: '587',
    defaultSla: '240',
    approvalPolicy: 'Restricted and legal mailboxes require approval',
  },
};

const STORAGE_KEY = 'angelcare-email-os-v12-execution-state';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}


async function emailOsRequest(path: string, payload?: Record<string, unknown>, method = 'POST') {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(payload || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Email OS request failed: ${path}`);
  return data?.data ?? data;
}

function addAudit(state: AppState, action: string): AppState {
  return { ...state, audit: [`${new Date().toLocaleTimeString()} · ${action}`, ...state.audit].slice(0, 80) };
}

function useEmailOsState() {
  const [state, setState] = useState<AppState>(initialState);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);
  const act = (label: string, updater?: (current: AppState) => AppState) => {
    setState((current) => addAudit(updater ? updater(current) : current, label));
  };
  const reset = () => setState(addAudit(initialState, 'Workspace reset to controlled baseline'));
  return { state, setState, act, reset };
}

function toneClasses(tone: Tone) {
  const map: Record<Tone, string> = {
    cyan: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300 hover:text-slate-950',
    emerald: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300 hover:text-slate-950',
    amber: 'border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300 hover:text-slate-950',
    rose: 'border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300 hover:text-slate-950',
    slate: 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800',
    violet: 'border-violet-300/40 bg-violet-300/10 text-violet-100 hover:bg-violet-300 hover:text-slate-950',
  };
  return map[tone];
}

function ActionButton({ children, icon: Icon = Zap, onClick, tone = 'cyan' }: { children: React.ReactNode; icon?: LucideIcon; onClick?: () => void; tone?: Tone }) {
  return (
    <button type="button" onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70', toneClasses(tone))}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function Pill({ children, tone = 'cyan' }: { children: React.ReactNode; tone?: Tone }) {
  const map: Record<Tone, string> = {
    cyan: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
    emerald: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
    rose: 'border-rose-300/40 bg-rose-400/10 text-rose-100',
    slate: 'border-slate-600 bg-slate-900 text-slate-200',
    violet: 'border-violet-300/40 bg-violet-400/10 text-violet-100',
  };
  return <span className={cx('rounded-full border px-3 py-1 text-xs font-black', map[tone])}>{children}</span>;
}

function StatusPill({ value }: { value: string }) {
  const tone: Tone = value.includes('Critical') || value.includes('Failed') || value.includes('Escalated') || value.includes('Restricted') || value.includes('blocked')
    ? 'rose'
    : value.includes('Warning') || value.includes('Waiting') || value.includes('Needs') || value.includes('Queued') || value.includes('Paused') || value.includes('Approval')
      ? 'amber'
      : value.includes('Connected') || value.includes('Completed') || value.includes('Resolved') || value.includes('Active') || value.includes('Sent')
        ? 'emerald'
        : 'cyan';
  return <Pill tone={tone}>{value}</Pill>;
}

function Panel({ title, icon: Icon, desc, children, actions }: { title: string; icon: LucideIcon; desc?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-600/90 bg-[#101b2e] p-5 shadow-2xl shadow-black/20">
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

function MetricCard({ label, value, icon: Icon, helper, tone = 'cyan', onClick }: { label: string; value: string | number; icon: LucideIcon; helper: string; tone?: Tone; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-3xl border border-slate-600/90 bg-[#101b2e] p-5 text-left shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#0f172a]">
      <div className="flex items-center justify-between gap-3">
        <div className={cx('rounded-2xl border p-3', toneClasses(tone).replace('hover:bg-cyan-300 hover:text-slate-950','').replace('hover:bg-emerald-300 hover:text-slate-950','').replace('hover:bg-amber-300 hover:text-slate-950','').replace('hover:bg-rose-300 hover:text-slate-950','').replace('hover:bg-slate-800','').replace('hover:bg-violet-300 hover:text-slate-950',''))}><Icon className="h-6 w-6" /></div>
        <ArrowRight className="h-4 w-4 text-cyan-300" />
      </div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{label}</div>
      <div className="mt-2 text-xs leading-5 text-slate-300">{helper}</div>
    </button>
  );
}

function ShellHeader({ title, activeNav, selectedMailbox, setSelectedMailbox, query, setQuery, act, router, reset }: { title: string; activeNav?: typeof nav[number]; selectedMailbox: string; setSelectedMailbox: (v: string) => void; query: string; setQuery: (v: string) => void; act: (v: string, updater?: (s: AppState) => AppState) => void; router: ReturnType<typeof useRouter>; reset: () => void }) {
  return (
    <header className="rounded-[2rem] border border-slate-600/90 bg-[#101b2e] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-200">AngelCare corporate email command</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300 md:text-base">{activeNav?.desc || 'Operational email workspace for routing, composing, permissions, configuration, delivery health and audit control.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedMailbox} onChange={(e) => { setSelectedMailbox(e.target.value); act('Selected active mailbox: ' + e.target.value); }} className="rounded-2xl border border-cyan-300/40 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20">
            {initialState.mailboxes.map(m => <option key={m.address} value={m.address}>{m.name} · {m.address}</option>)}
          </select>
          <ActionButton icon={RefreshCw} onClick={() => { act('Backend sync started for ' + selectedMailbox); emailOsRequest('/api/email-os/sync', { email: selectedMailbox, limit: 25 }).then((result) => act('Backend sync completed for ' + selectedMailbox + ': ' + JSON.stringify(result))).catch((error) => act('Backend sync failed for ' + selectedMailbox + ': ' + error.message)); }}>Refresh pulse</ActionButton>
          <ActionButton icon={Plus} tone="emerald" onClick={() => router.push('/email-os/composer/v12')}>New action</ActionButton>
          <ActionButton icon={Trash2} tone="slate" onClick={reset}>Reset state</ActionButton>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-600/90 bg-slate-950/80 px-4 py-3">
          <Search className="h-5 w-5 text-slate-300" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search thread, mailbox, deal, contact, note, failure log, template..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-200" />
        </div>
        <ActionButton icon={Filter} tone="slate" onClick={() => act('Saved filters opened: risk + unresolved + provider blockers')}>Saved filters</ActionButton>
        <ActionButton icon={Download} tone="slate" onClick={() => act('Exported current Email OS command view')}>Export view</ActionButton>
      </div>
    </header>
  );
}

function LeftNavigation({ pathname, router }: { pathname: string | null; router: ReturnType<typeof useRouter> }) {
  return (
    <aside className="hidden w-84 shrink-0 border-r border-cyan-400/20 bg-slate-950/95 p-5 backdrop-blur-xl xl:block">
      <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-5 shadow-2xl shadow-cyan-950/40">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-cyan-300/20 p-3"><Network className="h-7 w-7 text-cyan-200" /></div><div><p className="text-xs uppercase tracking-[0.35em] text-cyan-200">AngelCare</p><h1 className="text-xl font-black text-white">Email OS V12</h1></div></div>
        <p className="mt-4 text-sm leading-6 text-slate-300">Company-wide email operations: inbox execution, Menara setup, controlled sending, user permissions, audits and engine health.</p>
      </div>
      <nav className="mt-6 space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/') || (item.href !== '/email-os/v12' && pathname?.includes(item.href.replace('/email-os/', '').replace('/v12', '')));
          return (
            <button key={item.href} type="button" onClick={() => router.push(item.href)} className={cx('w-full rounded-2xl border p-4 text-left transition', active ? 'border-cyan-300/70 bg-cyan-300/20 text-white shadow-lg shadow-cyan-950/40' : 'border-slate-700/70 bg-[#101b2e] text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800/90 hover:text-white')}>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-200" /><span className="font-semibold text-white">{item.label}</span></span><span className="rounded-full border border-cyan-300/40 px-2 py-1 text-[10px] text-cyan-100">{item.tag}</span></div>
              <p className="mt-2 text-xs leading-5 text-slate-300">{item.desc}</p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function RightRail({ state, act, openEmail, router }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void; openEmail: (id: string) => void; router: ReturnType<typeof useRouter> }) {
  const [showLog, setShowLog] = useState(false);
  const critical = state.conversations.filter((c) => c.priority === 'Critical' || c.status === 'Escalated');
  const blockers = state.mailboxes.filter((m) => m.status !== 'Connected').length + state.queueJobs.filter((j) => j.state === 'Failed').length;
  const actions = [
    { label: 'Open top risk email', icon: Eye, tone: 'rose' as Tone, run: () => openEmail(critical[0]?.id || state.conversations[0]?.id) },
    { label: 'Create follow-up', icon: CalendarClock, tone: 'cyan' as Tone, run: () => act('Created follow-up from copilot rail') },
    { label: 'Draft reply', icon: Reply, tone: 'emerald' as Tone, run: () => router.push('/email-os/composer/v12') },
    { label: 'Escalate SLA risk', icon: Bell, tone: 'rose' as Tone, run: () => act('Escalated SLA risk queue') },
    { label: 'Sync mailboxes', icon: RefreshCw, tone: 'cyan' as Tone, run: () => { act('Started real mailbox sync sweep', s => ({ ...s, queueJobs: s.queueJobs.map(j => ({ ...j, state: j.state === 'Paused' ? 'Queued' : j.state })) })); emailOsRequest('/api/email-os/sync', { limit: 25 }).then((result) => act('Real mailbox sync sweep completed: ' + JSON.stringify(result))).catch((error) => act('Real mailbox sync sweep failed: ' + error.message)); } },
    { label: 'Retry failures', icon: Zap, tone: 'amber' as Tone, run: () => { act('Retried all failed jobs locally', s => ({ ...s, queueJobs: s.queueJobs.map(j => j.state === 'Failed' ? { ...j, state: 'Queued', retry: j.retry + 1 } : j) })); emailOsRequest('/api/email-os/outbox/retry', { limit: 10 }).then((result) => act('Backend outbox retry completed: ' + JSON.stringify(result))).catch((error) => act('Backend outbox retry failed: ' + error.message)); } },
    { label: 'Open config', icon: Settings, tone: 'slate' as Tone, run: () => router.push('/email-os/configuration/v12') },
    { label: 'Export audit', icon: Download, tone: 'slate' as Tone, run: () => act('Exported command audit package') },
  ];
  return (
    <aside className="space-y-4">
      <div className="rounded-[2rem] border border-cyan-300/30 bg-[#0f172a] p-5 shadow-2xl shadow-cyan-950/30">
        <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-100"><Bot className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-200">AI Command Intelligence</p><h3 className="mt-1 text-xl font-black text-white">Execution Copilot</h3><p className="mt-2 text-xs leading-5 text-slate-300">Action radar, risk detection and command shortcuts.</p></div></div><Pill tone="emerald">ONLINE</Pill></div>
        <div className="mt-5 grid gap-3"><div className="rounded-3xl border border-slate-600/90 bg-slate-900/90 p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-300">Critical command</p><div className="mt-1 text-3xl font-black text-white">{critical.length}</div><p className="mt-2 text-xs leading-5 text-slate-300">{critical[0]?.subject || 'No critical thread raised.'}</p></div><div className="rounded-3xl border border-slate-600/90 bg-slate-900/90 p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-300">Provider blockers</p><div className="mt-1 text-3xl font-black text-white">{blockers}</div><p className="mt-2 text-xs leading-5 text-slate-300">Missing credentials, failed jobs or restricted send controls.</p></div></div>
      </div>
      <div className="rounded-[2rem] border border-cyan-300/25 bg-[#101b2e] p-5"><h3 className="text-lg font-black text-white">Clickable command grid</h3><p className="mt-1 text-xs leading-5 text-slate-300">Every tile performs an action or navigates.</p><div className="mt-4 grid grid-cols-2 gap-2">{actions.map(a => <button key={a.label} type="button" onClick={a.run} className="rounded-2xl border border-slate-600/90 bg-slate-900/90 p-3 text-left transition hover:border-cyan-300/60 hover:bg-cyan-300/10"><a.icon className="h-4 w-4 text-cyan-200" /><div className="mt-2 text-xs font-black text-white">{a.label}</div></button>)}</div></div>
      <div className="rounded-[2rem] border border-slate-600/90 bg-[#101b2e] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-white">Command memory</h3><p className="mt-1 text-xs leading-5 text-slate-300">Latest: <span className="text-cyan-200">{state.audit[0] || 'No action yet'}</span></p></div><button type="button" onClick={() => setShowLog(!showLog)} className="rounded-2xl border border-slate-600 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-300/50">{showLog ? 'Hide' : 'Show'} log</button></div>{showLog ? <div className="mt-4 space-y-2">{(state.audit.length ? state.audit : ['No actions yet']).slice(0, 8).map((op) => <div key={op} className="rounded-2xl border border-slate-700/70 bg-slate-900/90 p-3 text-sm text-slate-200"><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-300" />{op}</div>)}</div> : <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">Audit is summarized until you open it.</div>}</div>
    </aside>
  );
}

export function EmailOSV12Shell({ mode = 'command' }: { mode?: V12Mode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, act, reset } = useEmailOsState();
  const [query, setQuery] = useState('');
  const [selectedMailbox, setSelectedMailbox] = useState('supports@angelcare.ma');
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [activeEmailId, setActiveEmailId] = useState<string | null>(state.conversations[0]?.id || null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [draftSubject, setDraftSubject] = useState('Follow-up regarding your AngelCare request');
  const [draftBody, setDraftBody] = useState('Hello,\n\nThank you for contacting AngelCare. We reviewed your request and prepared the next operational step.\n\nBest regards,\nAngelCare Team');
  const activeNav = useMemo(() => nav.find((n) => n.mode === mode) || nav.find((n) => pathname?.startsWith(n.href)), [mode, pathname]);
  const title = activeNav?.label || 'Command 360';
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return state.conversations;
    return state.conversations.filter(c => [c.subject, c.from, c.mailbox, c.owner, c.department, c.status, c.priority, c.revenueLink, c.partnerLink, c.client, c.lastMessage, ...c.tags].join(' ').toLowerCase().includes(normalized));
  }, [query, state.conversations]);
  const selectedConversationObjects = state.conversations.filter(c => selectedThreads.includes(c.id));
  const activeEmail = state.conversations.find(c => c.id === activeEmailId) || filteredConversations[0] || state.conversations[0];
  const openEmail = (id: string) => { setActiveEmailId(id); setIsReaderOpen(true); act('Opened email reader for ' + id); };
  const toggleThread = (id: string) => setSelectedThreads((current) => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const updateThreads = (ids: string[], updater: (c: Conversation) => Conversation, label: string) => {
    if (!ids.length) return act('No selected email for action: ' + label);
    act(label + ': ' + ids.join(', '), s => ({ ...s, conversations: s.conversations.map(c => ids.includes(c.id) ? updater(c) : c) }));
    setSelectedThreads([]);
  };
  const createDraft = (thread?: Conversation) => {
    const draft: Draft = { id: 'DRF-' + Date.now(), mailbox: thread?.mailbox || selectedMailbox, to: thread?.fromEmail || 'client@example.com', subject: draftSubject, body: draftBody, status: thread?.mailbox === 'Legal' ? 'Approval required' : 'Draft', linkedThread: thread?.id };
    act('Created local draft ' + draft.id, s => ({ ...s, drafts: [draft, ...s.drafts] }));
    emailOsRequest('/api/email-os/drafts', { account_email: selectedMailbox, to: [draft.to], subject: draft.subject, body_text: draft.body, approval_required: draft.status === 'Approval required', queue: draft.status !== 'Approval required', reason: 'Created from Email OS V12 Composer Studio' })
      .then((result) => act('Backend draft saved/queued: ' + (result?.id || draft.id)))
      .catch((error) => act('Backend draft failed: ' + error.message));
  };

  return (
    <div className="email-os-v12-scope min-h-screen bg-[#020617] text-white [&_*]:opacity-100 [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_h4]:!text-white [&_h5]:!text-white [&_p]:!text-slate-100 [&_span]:!text-slate-100 [&_small]:!text-slate-200 [&_label]:!text-slate-100 [&_strong]:!text-white [&_b]:!text-white [&_em]:!text-slate-100 [&_button]:!text-white [&_input]:!text-white [&_textarea]:!text-white [&_input::placeholder]:!text-slate-300 [&_textarea::placeholder]:!text-slate-300 [&_select]:!text-white [&_option]:!bg-slate-950 [&_option]:!text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="relative flex min-h-screen">
        <LeftNavigation pathname={pathname} router={router} />
        <main className="flex-1 p-4 md:p-8">
          <ShellHeader title={title} activeNav={activeNav} selectedMailbox={selectedMailbox} setSelectedMailbox={setSelectedMailbox} query={query} setQuery={setQuery} act={act} router={router} reset={reset} />
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Mailboxes" value={state.mailboxes.length} icon={Mail} helper="Click to manage mailbox registry." onClick={() => router.push('/email-os/mailboxes/v12')} />
            <MetricCard label="Open threads" value={state.conversations.filter(c => !['Resolved','Archived'].includes(c.status)).length} icon={Inbox} helper="Click to begin triage." tone="amber" onClick={() => router.push('/email-os/inbox/v12')} />
            <MetricCard label="SLA risk" value={state.mailboxes.reduce((sum, m) => sum + m.slaRisk, 0)} icon={Timer} helper="Click to open analytics." tone="rose" onClick={() => router.push('/email-os/analytics/v12')} />
            <MetricCard label="Queue jobs" value={state.queueJobs.length} icon={Server} helper="Click to control engine jobs." tone="emerald" onClick={() => router.push('/email-os/engine/v12')} />
          </section>
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]"><div className="space-y-6">
            {mode === 'command' && <CommandDashboard state={state} act={act} router={router} openEmail={openEmail} />}
            {mode === 'inbox' && <SuperInbox conversations={filteredConversations} selectedThreads={selectedThreads} toggleThread={toggleThread} updateThreads={updateThreads} openEmail={openEmail} />}
            {mode === 'threads' && <ThreadDossiers conversations={filteredConversations} selectedThreads={selectedThreads} toggleThread={toggleThread} updateThreads={updateThreads} openEmail={openEmail} />}
            {mode === 'composer' && <ComposerStudio state={state} selectedConversationObjects={selectedConversationObjects} draftSubject={draftSubject} setDraftSubject={setDraftSubject} draftBody={draftBody} setDraftBody={setDraftBody} createDraft={createDraft} act={act} />}
            {mode === 'access' && <AccessMatrix state={state} act={act} />}
            {mode === 'engine' && <EngineCenter state={state} act={act} />}
            {mode === 'analytics' && <AnalyticsCenter state={state} />}
            {mode === 'configuration' && <ConfigurationCenter state={state} act={act} />}
            {mode === 'mailboxes' && <MailboxRegistry state={state} act={act} />}
            {mode === 'templates' && <TemplateCenter state={state} act={act} setDraftSubject={setDraftSubject} setDraftBody={setDraftBody} router={router} />}
            {mode === 'automation' && <AutomationCenter state={state} act={act} />}
            {mode === 'audit' && <AuditCenter state={state} />}
            {mode === 'approvals' && <ApprovalCenter state={state} act={act} />}
            {mode === 'attachments' && <AttachmentCenter state={state} act={act} />}
            {mode === 'sync' && <SyncCenter state={state} act={act} />}
            {mode === 'outbox' && <OutboxCenter state={state} act={act} />}
            {mode === 'files' && <FileCenter state={state} act={act} />}
            {mode === 'follow-ups' && <FollowUpCenter state={state} act={act} />}
          </div><RightRail state={state} act={act} openEmail={openEmail} router={router} /></section>
        </main>
        {activeEmail ? <EmailReaderDrawer conversation={activeEmail} open={isReaderOpen} onClose={() => setIsReaderOpen(false)} onReply={() => { setDraftSubject('Re: ' + activeEmail.subject); setDraftBody('Hello,\n\nFollowing up on: ' + activeEmail.subject + '\n\n' + activeEmail.lastMessage + '\n\nBest regards,\nAngelCare Team'); act('Reply draft prepared for ' + activeEmail.id); router.push('/email-os/composer/v12'); }} onResolve={() => updateThreads([activeEmail.id], c => ({ ...c, status: 'Resolved' }), 'Resolved from reader')} onArchive={() => updateThreads([activeEmail.id], c => ({ ...c, status: 'Archived' }), 'Archived from reader')} onEscalate={() => updateThreads([activeEmail.id], c => ({ ...c, status: 'Escalated', priority: 'Critical' }), 'Escalated from reader')} onCreateTask={() => act('Follow-up task created from reader: ' + activeEmail.id)} /> : null}
      </div>
    </div>
  );
}

function CommandDashboard({ state, act, router, openEmail }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void; router: ReturnType<typeof useRouter>; openEmail: (id: string) => void }) {
  const urgent = state.conversations.filter(c => c.priority === 'Critical' || c.status === 'Escalated');
  const widgets = [
    { label: 'Open first critical email', icon: Eye, run: () => urgent[0] ? openEmail(urgent[0].id) : act('No critical email available') },
    { label: 'Start bulk triage', icon: CheckCircle2, run: () => router.push('/email-os/inbox/v12') },
    { label: 'Compose governed email', icon: Send, run: () => router.push('/email-os/composer/v12') },
    { label: 'Configure Menara', icon: Settings, run: () => router.push('/email-os/configuration/v12') },
    { label: 'Retry failed jobs', icon: RefreshCw, run: () => { act('Retried failed jobs from command home', s => ({ ...s, queueJobs: s.queueJobs.map(j => j.state === 'Failed' ? { ...j, state: 'Queued', retry: j.retry + 1 } : j) })); emailOsRequest('/api/email-os/outbox/retry', { limit: 10 }).then((result) => act('Backend retry completed from command home: ' + JSON.stringify(result))).catch((error) => act('Backend retry failed from command home: ' + error.message)); } },
    { label: 'Create digest', icon: FileText, run: () => act('Created executive digest with open threads and blockers') },
    { label: 'Open audit', icon: Shield, run: () => router.push('/email-os/audit/v12') },
    { label: 'Open approvals', icon: BadgeCheck, run: () => router.push('/email-os/approvals/v12') },
  ];
  return <><Panel title="Email general monitor dashboard" icon={Sparkles} desc="Clear command homepage: monitor risk, open emails, run workflows and continue operations." actions={<><ActionButton icon={Inbox} onClick={() => router.push('/email-os/inbox/v12')}>Start triage</ActionButton><ActionButton icon={Send} tone="emerald" onClick={() => router.push('/email-os/composer/v12')}>Compose</ActionButton><ActionButton icon={Settings} tone="slate" onClick={() => router.push('/email-os/configuration/v12')}>Configure</ActionButton></>}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
    { title: 'Triage cockpit', value: state.conversations.filter(c=>!['Resolved','Archived'].includes(c.status)).length, icon: Inbox, run: () => router.push('/email-os/inbox/v12') },
    { title: 'Provider blockers', value: state.mailboxes.filter(m=>m.status !== 'Connected').length, icon: ShieldCheck, run: () => router.push('/email-os/configuration/v12') },
    { title: 'Approval drafts', value: state.drafts.filter(d=>d.status==='Approval required').length, icon: BadgeCheck, run: () => router.push('/email-os/approvals/v12') },
    { title: 'Queue attention', value: state.queueJobs.filter(j=>j.state !== 'Completed').length, icon: Server, run: () => router.push('/email-os/engine/v12') },
  ].map(card => <button key={card.title} type="button" onClick={card.run} className="rounded-3xl border border-slate-600/90 bg-[#0f172a] p-5 text-left transition hover:border-cyan-300/50 hover:bg-[#0b1729]"><card.icon className="h-7 w-7 text-cyan-200"/><div className="mt-5 text-4xl font-black text-white">{card.value}</div><h4 className="mt-2 text-lg font-black text-white">{card.title}</h4><p className="mt-2 text-sm text-slate-300">Click to open the connected workspace.</p></button>)}</div></Panel><div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Panel title="Today’s priority board" icon={Target} desc="Click any email to read and act."><div className="space-y-3">{state.conversations.slice(0,6).map(c => <ConversationCard key={c.id} c={c} selected={false} onSelect={() => null} openEmail={openEmail} actions={<><ActionButton icon={Reply} onClick={() => { openEmail(c.id); act('Quick reply requested for ' + c.id); }} tone="emerald">Reply</ActionButton><ActionButton icon={Bell} onClick={() => act('Escalated ' + c.id, s => ({...s, conversations: s.conversations.map(x => x.id === c.id ? {...x, status:'Escalated', priority:'Critical'} : x)}))} tone="rose">Escalate</ActionButton></>} />)}</div></Panel><Panel title="Command widget wall" icon={Command} desc="Every widget performs an action."><div className="grid gap-3 sm:grid-cols-2">{widgets.map(w => <button key={w.label} type="button" onClick={w.run} className="rounded-3xl border border-slate-600/90 bg-slate-900/90 p-4 text-left transition hover:border-cyan-300/60 hover:bg-cyan-300/10"><w.icon className="h-5 w-5 text-cyan-200"/><div className="mt-3 text-sm font-black text-white">{w.label}</div></button>)}</div></Panel></div></>;
}

function ConversationCard({ c, selected, onSelect, openEmail, actions }: { c: Conversation; selected: boolean; onSelect: () => void; openEmail: (id: string) => void; actions?: React.ReactNode }) {
  return <div className={cx('rounded-3xl border p-4 transition', selected ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-slate-600/90 bg-[#0f172a] hover:border-cyan-300/40')}><div className="grid gap-4 lg:grid-cols-[auto_1fr_auto]"><input type="checkbox" checked={selected} onChange={onSelect} className="mt-2 h-5 w-5 accent-cyan-300" /><button type="button" onClick={() => openEmail(c.id)} className="text-left"><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-black text-white hover:text-cyan-100">{c.subject}</h4><StatusPill value={c.priority}/><StatusPill value={c.status}/></div><p className="mt-2 text-sm leading-6 text-slate-300">{c.lastMessage}</p><div className="mt-3 flex flex-wrap gap-2 text-xs">{[c.id,c.mailbox,c.owner,c.sla,c.revenueLink].map(tag => <span key={tag} className="rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-slate-300">{tag}</span>)}</div></button><div className="flex flex-wrap gap-2 lg:justify-end"><ActionButton icon={Eye} onClick={() => openEmail(c.id)}>Read</ActionButton>{actions}</div></div></div>;
}

function SuperInbox({ conversations, selectedThreads, toggleThread, updateThreads, openEmail }: { conversations: Conversation[]; selectedThreads: string[]; toggleThread: (id: string) => void; updateThreads: (ids: string[], updater: (c: Conversation) => Conversation, label: string) => void; openEmail: (id: string) => void }) {
  const ids = selectedThreads;
  return <Panel title="Super Inbox execution floor" icon={Inbox} desc="Select emails and perform real persistent actions." actions={<><ActionButton icon={UserCheck} onClick={() => updateThreads(ids, c => ({ ...c, status:'Assigned', owner:'Operations Lead' }), 'Bulk assigned')}>Assign</ActionButton><ActionButton icon={Archive} tone="amber" onClick={() => updateThreads(ids, c => ({ ...c, status:'Archived' }), 'Bulk archived')}>Archive</ActionButton><ActionButton icon={CheckCircle2} tone="emerald" onClick={() => updateThreads(ids, c => ({ ...c, status:'Resolved' }), 'Bulk resolved')}>Resolve</ActionButton><ActionButton icon={Tag} onClick={() => updateThreads(ids, c => ({ ...c, tags:[...new Set([...c.tags,'reviewed'])] }), 'Tagged reviewed')}>Tag</ActionButton></>}><div className="space-y-3">{conversations.map(c => <ConversationCard key={c.id} c={c} selected={selectedThreads.includes(c.id)} onSelect={() => toggleThread(c.id)} openEmail={openEmail} actions={<><ActionButton icon={Reply} tone="emerald" onClick={() => openEmail(c.id)}>Reply</ActionButton><ActionButton icon={Bell} tone="rose" onClick={() => updateThreads([c.id], x=>({...x,status:'Escalated',priority:'Critical'}),'Escalated')}>Escalate</ActionButton></>} />)}</div></Panel>;
}

function ThreadDossiers({ conversations, selectedThreads, toggleThread, updateThreads, openEmail }: { conversations: Conversation[]; selectedThreads: string[]; toggleThread: (id: string) => void; updateThreads: (ids: string[], updater: (c: Conversation) => Conversation, label: string) => void; openEmail: (id: string) => void }) {
  const active = conversations.find(c => selectedThreads.includes(c.id)) || conversations[0];
  return <Panel title="Thread dossier command" icon={MessageSquare} desc="Open, inspect, note, link, resolve or escalate each conversation."><div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]"><div className="space-y-3">{conversations.map(c => <button key={c.id} onClick={() => toggleThread(c.id)} className={cx('w-full rounded-3xl border p-4 text-left', active?.id === c.id ? 'border-cyan-300/70 bg-cyan-300/10' : 'border-slate-600/90 bg-[#0f172a]')}><h4 className="font-black text-white">{c.subject}</h4><p className="mt-1 text-sm text-slate-300">{c.from} · {c.mailbox}</p><div className="mt-2 flex gap-2"><StatusPill value={c.priority}/><StatusPill value={c.status}/></div></button>)}</div>{active ? <div className="rounded-[2rem] border border-slate-600/90 bg-[#0f172a] p-5"><h3 className="text-2xl font-black text-white">{active.subject}</h3><p className="mt-2 text-slate-300">{active.body}</p><div className="mt-4 flex flex-wrap gap-2"><StatusPill value={active.priority}/><StatusPill value={active.status}/><Pill tone="emerald">{active.client}</Pill></div><div className="mt-5 grid gap-3 md:grid-cols-2"><ActionButton icon={Eye} onClick={() => openEmail(active.id)}>Open reader</ActionButton><ActionButton icon={Link2} onClick={() => updateThreads([active.id], c=>({...c, notes:[`Linked business context at ${new Date().toLocaleTimeString()}`,...c.notes]}),'Linked context')}>Link context</ActionButton><ActionButton icon={CheckCircle2} tone="emerald" onClick={() => updateThreads([active.id], c=>({...c,status:'Resolved'}),'Resolved thread')}>Resolve</ActionButton><ActionButton icon={Bell} tone="rose" onClick={() => updateThreads([active.id], c=>({...c,status:'Escalated',priority:'Critical'}),'Escalated thread')}>Escalate</ActionButton></div><div className="mt-5 space-y-2">{active.notes.map(n => <div key={n} className="rounded-2xl bg-slate-950 p-3 text-sm text-slate-300">{n}</div>)}</div></div> : null}</div></Panel>;
}

function ComposerStudio({ state, selectedConversationObjects, draftSubject, setDraftSubject, draftBody, setDraftBody, createDraft, act }: { state: AppState; selectedConversationObjects: Conversation[]; draftSubject: string; setDraftSubject: (v:string)=>void; draftBody: string; setDraftBody: (v:string)=>void; createDraft: (thread?: Conversation)=>void; act: (v: string, updater?: (s: AppState) => AppState) => void }) {
  return <Panel title="Composer Studio" icon={Send} desc="Draft, improve, save, approve and queue send records." actions={<><ActionButton icon={Save} onClick={() => createDraft(selectedConversationObjects[0])}>Save draft</ActionButton><ActionButton icon={Wand2} onClick={() => { setDraftBody(draftBody + '\n\n[Quality check completed: clear next step added.]'); act('Improved draft body with assistant'); }}>Improve</ActionButton></>}><div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]"><div className="space-y-4"><select className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">{state.mailboxes.map(m=><option key={m.id}>{m.name} · {m.address}</option>)}</select><input value={draftSubject} onChange={e=>setDraftSubject(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"/><textarea value={draftBody} onChange={e=>setDraftBody(e.target.value)} rows={12} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"/><div className="flex flex-wrap gap-2"><ActionButton icon={Paperclip} tone="slate" onClick={() => act('Attachment placeholder added to draft')}>Attach</ActionButton><ActionButton icon={BadgeCheck} tone="amber" onClick={() => act('Approval requested for current draft')}>Request approval</ActionButton></div></div><div className="rounded-[2rem] border border-slate-700 bg-white p-5 text-slate-950"><b>Live preview</b><h4 className="mt-4 text-xl font-black">{draftSubject}</h4><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6">{draftBody}</pre></div></div></Panel>;
}

function AccessMatrix({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Access Matrix" icon={UserCog} desc="Toggle permissions and persist them."><div className="space-y-3">{state.permissions.map(p => <div key={p.id} className="rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-white">{p.user}</b><p className="text-sm text-slate-300">{p.role} · {p.mailbox}</p></div><div className="flex flex-wrap gap-2">{(['read','send','approve','admin'] as const).map(k => <ActionButton key={k} icon={p[k] ? CheckCircle2 : Lock} tone={p[k] ? 'emerald':'rose'} onClick={() => act(`Toggled ${k} for ${p.user}`, s=>({...s, permissions:s.permissions.map(x=>x.id===p.id?{...x,[k]:!x[k]}:x)}))}>{k}: {String(p[k])}</ActionButton>)}</div></div></div>)}</div></Panel>; }
function EngineCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Engine Center" icon={Server} desc="Retry, pause, complete or delete jobs." actions={<ActionButton icon={RefreshCw} onClick={() => act('Retried all failed jobs', s=>({...s,queueJobs:s.queueJobs.map(j=>j.state==='Failed'?{...j,state:'Queued',retry:j.retry+1}:j)}))}>Retry failed</ActionButton>}><div className="space-y-3">{state.queueJobs.map(j => <div key={j.id} className="rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><div className="flex flex-wrap justify-between gap-3"><div><b className="text-white">{j.job}</b><p className="text-sm text-slate-300">{j.id} · {j.impact}</p></div><StatusPill value={j.state}/></div><div className="mt-3 flex flex-wrap gap-2"><ActionButton icon={RefreshCw} onClick={() => act('Retried '+j.id, s=>({...s,queueJobs:s.queueJobs.map(x=>x.id===j.id?{...x,state:'Queued',retry:x.retry+1}:x)}))}>Retry</ActionButton><ActionButton icon={PauseCircle} tone="amber" onClick={() => act('Paused '+j.id, s=>({...s,queueJobs:s.queueJobs.map(x=>x.id===j.id?{...x,state:'Paused'}:x)}))}>Pause</ActionButton><ActionButton icon={CheckCircle2} tone="emerald" onClick={() => act('Completed '+j.id, s=>({...s,queueJobs:s.queueJobs.map(x=>x.id===j.id?{...x,state:'Completed'}:x)}))}>Complete</ActionButton><ActionButton icon={Trash2} tone="rose" onClick={() => act('Deleted '+j.id, s=>({...s,queueJobs:s.queueJobs.filter(x=>x.id!==j.id)}))}>Delete</ActionButton></div></div>)}</div></Panel>; }
function AnalyticsCenter({ state }: { state: AppState }) { return <Panel title="Analytics" icon={BarChart3}><div className="grid gap-4 md:grid-cols-2"><MetricCard label="Critical" value={state.conversations.filter(c=>c.priority==='Critical').length} icon={Bell} helper="Critical active threads." tone="rose"/><MetricCard label="Connected mailboxes" value={state.mailboxes.filter(m=>m.status==='Connected').length} icon={Gauge} helper="Provider connection state." tone="emerald"/><MetricCard label="Drafts" value={state.drafts.length} icon={FileText} helper="Created outbound drafts."/><MetricCard label="Audit events" value={state.audit.length} icon={Shield} helper="Recorded actions." tone="violet"/></div></Panel>; }
function ConfigurationCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { const [form,setForm]=useState(state.config); return <Panel title="Configuration Center" icon={Settings} desc="Save Menara SMTP/IMAP configuration and test provider status." actions={<><ActionButton icon={Save} tone="emerald" onClick={()=>act('Saved Email OS configuration',s=>({...s,config:form}))}>Save configuration</ActionButton><ActionButton icon={RefreshCw} onClick={()=>{ act('Testing Menara provider through supports@angelcare.ma: '+form.imapHost+' / '+form.smtpHost); emailOsRequest('/api/email-os/accounts/test', { email: 'supports@angelcare.ma' }).then((result) => act('Menara backend provider test completed: '+JSON.stringify(result))).catch((error) => act('Menara backend provider test failed: '+error.message)); }}>Test connection</ActionButton></>}><div className="grid gap-4 md:grid-cols-2">{(Object.keys(form) as Array<keyof typeof form>).map(k=><label key={k} className="block"><span className="mb-2 block text-sm font-bold text-slate-200">{k}</span><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"/></label>)}</div></Panel>; }
function MailboxRegistry({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Mailbox Registry" icon={Mail} actions={<ActionButton icon={Plus} tone="emerald" onClick={()=>act('Created mailbox record',s=>({...s,mailboxes:[{...initialState.mailboxes[0],id:'mbx-'+Date.now(),name:'New Mailbox',address:'new@angelcare.ma',status:'Needs setup'},...s.mailboxes]}))}>Create mailbox</ActionButton>}><div className="space-y-3">{state.mailboxes.map(m=><div key={m.id} className="rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><div className="flex flex-wrap justify-between gap-3"><div><b className="text-white">{m.name}</b><p className="text-sm text-slate-300">{m.address} · {m.owner}</p></div><StatusPill value={m.status}/></div><div className="mt-3 flex flex-wrap gap-2"><ActionButton icon={CheckCircle2} tone="emerald" onClick={()=>{ act('Testing real mailbox connection: '+m.address); emailOsRequest('/api/email-os/accounts/test', { email: m.address }).then(() => act('Marked mailbox connected after backend test: '+m.name,s=>({...s,mailboxes:s.mailboxes.map(x=>x.id===m.id?{...x,status:'Connected'}:x)}))).catch((error) => act('Mailbox connection test failed for '+m.address+': '+error.message,s=>({...s,mailboxes:s.mailboxes.map(x=>x.id===m.id?{...x,status:'Warning'}:x)}))); }}>Connect</ActionButton><ActionButton icon={Edit3} onClick={()=>act('Edited mailbox owner: '+m.name,s=>({...s,mailboxes:s.mailboxes.map(x=>x.id===m.id?{...x,owner:'Updated Owner'}:x)}))}>Edit</ActionButton><ActionButton icon={Trash2} tone="rose" onClick={()=>act('Deleted mailbox: '+m.name,s=>({...s,mailboxes:s.mailboxes.filter(x=>x.id!==m.id)}))}>Delete</ActionButton></div></div>)}</div></Panel>; }
function TemplateCenter({ state, act, setDraftSubject, setDraftBody, router }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void; setDraftSubject:(v:string)=>void; setDraftBody:(v:string)=>void; router: ReturnType<typeof useRouter> }) { return <Panel title="Template Center" icon={FileText} actions={<ActionButton icon={Plus} tone="emerald" onClick={()=>act('Created template',s=>({...s,templates:[{id:'TPL-'+Date.now(),name:'New template',category:'General',subject:'New subject',approval:'No approval',quality:80,body:'Hello,'},...s.templates]}))}>Create template</ActionButton>}><div className="grid gap-3 md:grid-cols-2">{state.templates.map(t=><div key={t.id} className="rounded-3xl border border-slate-700 bg-[#0f172a] p-4"><h4 className="font-black text-white">{t.name}</h4><p className="mt-1 text-sm text-slate-300">{t.subject}</p><div className="mt-3 flex flex-wrap gap-2"><ActionButton icon={Copy} onClick={()=>{setDraftSubject(t.subject);setDraftBody(t.body);act('Loaded template into composer: '+t.name);router.push('/email-os/composer/v12')}}>Use</ActionButton><ActionButton icon={Edit3} onClick={()=>act('Improved template quality: '+t.name,s=>({...s,templates:s.templates.map(x=>x.id===t.id?{...x,quality:Math.min(100,x.quality+1)}:x)}))}>Improve</ActionButton><ActionButton icon={Trash2} tone="rose" onClick={()=>act('Deleted template: '+t.name,s=>({...s,templates:s.templates.filter(x=>x.id!==t.id)}))}>Delete</ActionButton></div></div>)}</div></Panel>; }
function AutomationCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Automation Center" icon={Workflow}><div className="space-y-3">{state.automations.map(r=><div key={r.id} className="rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><b className="text-white">{r.name}</b><p className="text-sm text-slate-300">{r.trigger} → {r.action}</p><div className="mt-3 flex gap-2"><StatusPill value={r.status}/><ActionButton icon={PauseCircle} onClick={()=>act('Toggled automation: '+r.name,s=>({...s,automations:s.automations.map(x=>x.id===r.id?{...x,status:x.status==='Active'?'Paused':'Active'}:x)}))}>{r.status==='Active'?'Pause':'Activate'}</ActionButton></div></div>)}</div></Panel>; }
function AuditCenter({ state }: { state: AppState }) { return <Panel title="Audit Trail" icon={Shield}>{(state.audit.length?state.audit:['No audit event yet.']).map(a=><div key={a} className="mb-2 rounded-2xl border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-200">{a}</div>)}</Panel>; }
function ApprovalCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { const drafts=state.drafts.filter(d=>d.status==='Approval required'); return <Panel title="Approval Center" icon={BadgeCheck}>{drafts.length?drafts.map(d=><DraftLine key={d.id} d={d} act={act}/>):<p className="text-slate-300">No approval drafts. Create one from Legal mailbox or Composer.</p>}</Panel>; }
function OutboxCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Outbox" icon={Send}>{state.drafts.length?state.drafts.map(d=><DraftLine key={d.id} d={d} act={act}/>):<p className="text-slate-300">No drafts yet.</p>}</Panel>; }
function DraftLine({ d, act }: { d: Draft; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <div className="mb-3 rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><div className="flex flex-wrap justify-between gap-3"><div><b className="text-white">{d.subject}</b><p className="text-sm text-slate-300">{d.to} · {d.mailbox}</p></div><StatusPill value={d.status}/></div><div className="mt-3 flex flex-wrap gap-2"><ActionButton icon={BadgeCheck} tone="emerald" onClick={()=>act('Approved draft '+d.id,s=>({...s,drafts:s.drafts.map(x=>x.id===d.id?{...x,status:'Draft'}:x)}))}>Approve</ActionButton><ActionButton icon={Send} onClick={()=>act('Queued draft '+d.id,s=>({...s,drafts:s.drafts.map(x=>x.id===d.id?{...x,status:'Queued'}:x),queueJobs:[{id:'JOB-'+Date.now(),job:'Send '+d.subject,mailbox:d.mailbox,state:'Queued',owner:'Outbox',retry:0,impact:'Queued outbound draft'},...s.queueJobs]}))}>Queue</ActionButton><ActionButton icon={Trash2} tone="rose" onClick={()=>act('Deleted draft '+d.id,s=>({...s,drafts:s.drafts.filter(x=>x.id!==d.id)}))}>Delete</ActionButton></div></div>; }
function AttachmentCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Attachments" icon={Paperclip}>{state.conversations.map(c=><div key={c.id} className="mb-3 rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><b className="text-white">{c.id} · {c.subject}</b><p className="mt-2 text-sm text-slate-300">{c.attachments.length?c.attachments.join(', '):'No attachments'}</p><ActionButton icon={Paperclip} onClick={()=>act('Attached proof file to '+c.id,s=>({...s,conversations:s.conversations.map(x=>x.id===c.id?{...x,attachments:[...x.attachments,'proof-'+Date.now()+'.pdf']}:x)}))}>Add proof</ActionButton></div>)}</Panel>; }
function SyncCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Sync Center" icon={RefreshCw} actions={<ActionButton icon={RefreshCw} onClick={()=>act('Created sync jobs for all mailboxes',s=>({...s,queueJobs:[...s.mailboxes.map(m=>({id:'JOB-'+Date.now()+m.id,job:'Sync '+m.name,mailbox:m.name,state:'Queued' as const,owner:'Sync Engine',retry:0,impact:'Manual sync requested'})),...s.queueJobs]}))}>Sync all</ActionButton>}>{state.queueJobs.map(j=><div key={j.id} className="mb-2 text-slate-300">{j.id} · {j.job} · {j.state}</div>)}</Panel>; }
function FileCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Files" icon={Database}><p className="text-slate-300">Files are linked through thread attachments and proof records.</p><ActionButton icon={Download} onClick={()=>act('Exported email file index')}>Export file index</ActionButton></Panel>; }
function FollowUpCenter({ state, act }: { state: AppState; act: (v: string, updater?: (s: AppState) => AppState) => void }) { return <Panel title="Follow-ups" icon={CalendarClock}>{state.conversations.filter(c=>!['Resolved','Archived'].includes(c.status)).map(c=><div key={c.id} className="mb-3 rounded-2xl border border-slate-700 bg-[#0f172a] p-4"><b className="text-white">{c.subject}</b><p className="text-sm text-slate-300">{c.sla} · {c.owner}</p><ActionButton icon={CalendarClock} onClick={()=>act('Scheduled follow-up for '+c.id)}>Schedule follow-up</ActionButton></div>)}</Panel>; }
function EmailReaderDrawer({ conversation, open, onClose, onReply, onResolve, onArchive, onEscalate, onCreateTask }: { conversation: Conversation; open: boolean; onClose:()=>void; onReply:()=>void; onResolve:()=>void; onArchive:()=>void; onEscalate:()=>void; onCreateTask:()=>void }) { if(!open) return null; return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"><aside className="h-full w-full max-w-3xl overflow-y-auto border-l border-cyan-300/30 bg-[#020617] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Email Reader</p><h2 className="mt-2 text-3xl font-black text-white">{conversation.subject}</h2><p className="mt-2 text-slate-300">{conversation.from} · {conversation.fromEmail} · {conversation.mailbox}</p></div><button onClick={onClose} className="rounded-2xl border border-slate-700 bg-slate-950 p-3 text-white hover:border-cyan-300"><X className="h-5 w-5"/></button></div><div className="mt-5 flex flex-wrap gap-2"><StatusPill value={conversation.priority}/><StatusPill value={conversation.status}/><Pill tone="emerald">{conversation.client}</Pill><Pill tone="slate">{conversation.sla}</Pill></div><div className="mt-6 rounded-[2rem] border border-slate-700 bg-[#101b2e] p-5"><h3 className="font-black text-white">Message body</h3><pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{conversation.body}</pre></div><div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-3xl border border-slate-700 bg-[#101b2e] p-4"><h4 className="font-black text-white">Business context</h4><p className="mt-2 text-sm text-slate-300">{conversation.revenueLink}</p><p className="text-sm text-slate-300">{conversation.partnerLink}</p></div><div className="rounded-3xl border border-slate-700 bg-[#101b2e] p-4"><h4 className="font-black text-white">Attachments</h4><p className="mt-2 text-sm text-slate-300">{conversation.attachments.length?conversation.attachments.join(', '):'No attachments'}</p></div></div><div className="mt-5 rounded-3xl border border-slate-700 bg-[#101b2e] p-4"><h4 className="font-black text-white">Internal notes</h4><div className="mt-3 space-y-2">{conversation.notes.map(n=><div key={n} className="rounded-2xl bg-slate-950 p-3 text-sm text-slate-300">{n}</div>)}</div></div><div className="sticky bottom-0 mt-6 flex flex-wrap gap-2 border-t border-slate-800 bg-[#020617]/95 py-4"><ActionButton icon={Reply} tone="emerald" onClick={onReply}>Reply</ActionButton><ActionButton icon={CheckCircle2} tone="emerald" onClick={onResolve}>Resolve</ActionButton><ActionButton icon={Archive} tone="amber" onClick={onArchive}>Archive</ActionButton><ActionButton icon={Bell} tone="rose" onClick={onEscalate}>Escalate</ActionButton><ActionButton icon={CalendarClock} onClick={onCreateTask}>Create task</ActionButton></div></aside></div>; }

export default EmailOSV12Shell;
