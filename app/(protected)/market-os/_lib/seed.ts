import type { MarketRecord } from './types';

const now = new Date().toISOString();

export const initialMarketRecords: MarketRecord[] = [
  {
    id: 'str-rabat-capture', kind: 'strategy', title: 'Rabat/Témara/Salé market domination system', type: 'market', owner: 'CEO', status: 'active', priority: 'critical', createdAt: now, updatedAt: now,
    objective: 'Build a repeatable dominance machine for childcare, special needs support and postpartum demand across Rabat axis.', city: 'Rabat', segment: 'Premium families', kpis: ['Market Dominance Index', 'Qualified lead velocity', 'Booking conversion', 'Offer acceptance'], driveUrl: '', notes: 'Board-level strategy linked to offers, scripts, local partnerships and execution missions.', score: 82, nextAction: 'Approve 7-day local capture sprint and assign owners.'
  },
  {
    id: 'mis-rabat-sprint', kind: 'mission', title: '7-day Rabat capture sprint', owner: 'Marketing Director', status: 'active', priority: 'critical', createdAt: now, updatedAt: now,
    strategyId: 'str-rabat-capture', team: ['Ads Agent', 'Content Lead', 'SEO Agent', 'SDR Interface'], slaHours: 168, city: 'Rabat', segment: 'Premium families', score: 76, nextAction: 'Review blocker queue and validate two offer assets.'
  },
  {
    id: 'task-drive-pack', kind: 'task', title: 'Prepare Drive asset pack for premium childcare offer', owner: 'Content Lead', status: 'review', priority: 'high', createdAt: now, updatedAt: now,
    missionId: 'mis-rabat-sprint', assignee: 'Content Agent 2', dueDate: now.slice(0,10), city: 'Rabat', segment: 'Premium families', score: 68, nextAction: 'Submit final Drive URL and checklist proof.'
  },
  {
    id: 'off-postpartum-premium', kind: 'offer', title: 'Premium post-partum recovery support', service: 'Post-partum', positioning: 'Relief, recovery, confidence and supervised home support after birth.', components: ['2h diagnostic', 'Caregiver matching', 'Weekly supervision', 'Mother relief script'], targetSegment: 'New mothers', owner: 'Marketing Director', status: 'approved', priority: 'high', createdAt: now, updatedAt: now, city: 'Rabat', segment: 'New mothers', score: 88, nextAction: 'Create Rabat-specific price ladder and proof carousel.'
  },
  {
    id: 'fun-special-needs', kind: 'funnel', title: 'Special needs trust acquisition funnel', city: 'Casablanca', segment: 'Parents of children with specific needs', owner: 'Manager', status: 'active', priority: 'high', createdAt: now, updatedAt: now,
    stages: [{ name: 'Concern signal', target: 500, actual: 210 }, { name: 'Diagnostic request', target: 80, actual: 34 }, { name: 'Assessment booked', target: 30, actual: 8 }, { name: 'Paid start', target: 15, actual: 4 }], offerId: 'off-postpartum-premium', scriptIds: ['scr-call-trust'], score: 61, nextAction: 'Fix assessment-booking leakage with stronger qualification script.'
  },
  {
    id: 'scr-call-trust', kind: 'script', title: 'High-trust qualification call script', scriptType: 'call', version: 'v1.0', content: 'Diagnose urgency, reassure parent, explain AngelCare supervision, propose structured assessment.', owner: 'Brand Lead', status: 'review', priority: 'medium', createdAt: now, updatedAt: now, score: 70, nextAction: 'Manager approval required before SDR usage.'
  },
  {
    id: 'price-rabat-postpartum', kind: 'pricing', title: 'Rabat postpartum launch pricing ladder', offerId: 'off-postpartum-premium', city: 'Rabat', segment: 'New mothers', basePriceMad: 390, promoRule: 'Launch diagnostic included for first 20 bookings', effectiveFrom: now.slice(0,10), owner: 'CEO', status: 'active', priority: 'high', createdAt: now, updatedAt: now, score: 84, nextAction: 'Test premium bundle at 690 MAD with supervision included.'
  },
  {
    id: 'asset-drive-brand', kind: 'asset', title: 'AngelCare premium family trust Drive bank', assetType: 'folder', tags: ['brand', 'proof', 'offers', 'drive'], owner: 'Brand Lead', status: 'active', priority: 'high', createdAt: now, updatedAt: now, driveUrl: '', score: 73, nextAction: 'Attach final Google Drive production folder.'
  },
  {
    id: 'exp-kenitra', kind: 'expansion', title: 'Kénitra market activation playbook', city: 'Kénitra', segment: 'Families + preschools', readinessScore: 64, checklist: [{ label: 'Local offer adapted', done: true }, { label: 'Ambassador pipeline ready', done: false }, { label: 'SEO landing page mapped', done: true }, { label: 'Local partnership list verified', done: false }], owner: 'Expansion Manager', status: 'active', priority: 'high', createdAt: now, updatedAt: now, score: 64, nextAction: 'Complete ambassador pipeline before launch approval.'
  },
  {
    id: 'alert-leakage', kind: 'alert', title: 'Funnel leakage detected in assessment booking', severity: 'high', source: 'funnel', actionRequired: 'Create correction task and revise call script within 24h.', owner: 'AI Director', status: 'active', priority: 'critical', createdAt: now, updatedAt: now, linkedIds: ['fun-special-needs'], score: 91, nextAction: 'Convert to corrective mission.'
  },
  {
    id: 'amb-rabat-moms', kind: 'ambassador', title: 'Rabat mother ambassador trust circle', category: 'Local trust', channel: 'Community + Instagram + WhatsApp groups', impact: 'Referral demand and proof creation', owner: 'Ambassador Manager', status: 'active', priority: 'high', createdAt: now, updatedAt: now, city: 'Rabat', segment: 'Mothers', score: 72, nextAction: 'Assign 5 ambassador proof missions.'
  },
  {
    id: 'seo-postpartum-rabat', kind: 'seo', title: 'SEO cluster: aide maman après accouchement Rabat', category: 'Keyword cluster', channel: 'Website + blog', impact: 'Long-term inbound demand', owner: 'SEO Agent', status: 'active', priority: 'medium', createdAt: now, updatedAt: now, city: 'Rabat', segment: 'New mothers', score: 58, nextAction: 'Draft pillar page + 4 supporting articles.'
  },
  {
    id: 'pr-preschool-authority', kind: 'pr', title: 'Authority PR: childcare standards for preschools', category: 'Thought leadership', channel: 'Blog + partner outreach', impact: 'B2B credibility and school acquisition', owner: 'PR Lead', status: 'draft', priority: 'medium', createdAt: now, updatedAt: now, city: 'Casablanca', segment: 'Preschools', score: 55, nextAction: 'Prepare article brief and partner distribution list.'
  },
  {
    id: 'partner-preschool-rabat', kind: 'partnership', title: 'Rabat preschool referral partnership track', category: 'B2B acquisition', channel: 'Preschool owners', impact: 'Recurring qualified family referrals', owner: 'Partnership Manager', status: 'review', priority: 'high', createdAt: now, updatedAt: now, city: 'Rabat', segment: 'Preschools', score: 66, nextAction: 'Approve partner pitch script and outreach list.'
  }
];
