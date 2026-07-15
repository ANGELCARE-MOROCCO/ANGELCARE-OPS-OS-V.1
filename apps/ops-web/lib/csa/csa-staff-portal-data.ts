export const csaPortalData = {
  kpis: [
    { label: 'Priority Families', value: '32', href: '/families', icon: '🏡' },
    { label: 'Lead Follow-ups', value: '47', href: '/leads', icon: '📞' },
    { label: 'Revenue at Risk', value: '41.8K MAD', href: '/revenue-command-center', icon: '💎' },
    { label: 'Service Activations', value: '22', href: '/services', icon: '🧩' },
    { label: 'Open Escalations', value: '11', href: '/incidents', icon: '🚨' }
  ],
  nav: [
    ['C.S.A Home','/csa-home','🎧'], ['Families','/families','🏡'], ['Leads','/leads','📈'],
    ['Services','/services','🧩'], ['Sales','/sales','🚀'], ['Revenue','/revenue-command-center','💎'],
    ['Complaints','/incidents','🚨'], ['Voice','/voice-center','☎️'], ['Tasks','/revenue-command-center/tasks','✅'], ['Reports','/reports','📊']
  ],
  familyQueue: [
    ['Famille Benali','Service start confirmation','Critical','/services'],
    ['Famille El Mansouri','Proposal hesitation follow-up','Critical','/revenue-command-center'],
    ['Famille Idrissi','Complaint recovery call','High','/families'],
    ['Famille Alaoui','Upsell service extension','Medium','/sales']
  ],
  modules: [
    ['Lead Recovery Queue','/leads','Callbacks, WhatsApp follow-ups, hot prospects and lost lead recovery.'],
    ['Family Success Timeline','/families','Family history, satisfaction, complaints, renewals and account health.'],
    ['Service Activation Desk','/services','Start conditions, missing info, activation blockers and launch confirmation.'],
    ['Revenue Risk Radar','/revenue-command-center','Late decisions, payment risk, objections and deal recovery.'],
    ['Sales Handoff Board','/sales','Qualified leads, proposal handoff, sales notes and conversion support.'],
    ['Complaints & Escalations','/incidents','Urgent problems, service quality issues and closure ownership.']
  ],
  ai: [
    'Call Famille El Mansouri before 12:30 to recover proposal delay.',
    'Escalate 3 unresolved complaints to Operations before end of day.',
    'Send B2B partnership recap to Crèche Les Petits Génies.',
    'Push service activation checklist for 6 families ready to start.'
  ],
  activity: [
    ['New lead assigned from Facebook campaign','3 min ago','/leads'],
    ['Family complaint marked high priority','18 min ago','/incidents'],
    ['Service activation approved','42 min ago','/services'],
    ['Revenue recovery task created','1h ago','/revenue-command-center/tasks']
  ]
}
