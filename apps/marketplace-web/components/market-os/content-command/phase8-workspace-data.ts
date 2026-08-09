export type Phase8Status = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'blocked';
export type Phase8Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Phase8KpiCard {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface Phase8QueueItem {
  id: string;
  title: string;
  owner: string;
  status: Phase8Status;
  priority: Phase8Priority;
  dueDate: string;
}

export interface Phase8AssetItem {
  id: string;
  title: string;
  format: 'pdf' | 'image' | 'video' | 'presentation' | 'copy';
  campaign: string;
  status: Phase8Status;
  language: 'fr' | 'ar' | 'en';
}

export interface Phase8CampaignDeliverable {
  id: string;
  campaign: string;
  deliverable: string;
  owner: string;
  readiness: number;
  status: Phase8Status;
}

export interface Phase8ProductSheet {
  id: string;
  title: string;
  category: string;
  seoScore: number;
  completeness: number;
  status: Phase8Status;
}

export interface Phase8BrandItem {
  id: string;
  title: string;
  type: 'logo' | 'template' | 'color' | 'font' | 'guideline';
  approved: boolean;
  notes: string;
}

export const phase8Kpis: Phase8KpiCard[] = [
  { id: 'active-work', label: 'Active Work', value: '24', detail: 'Assets and deliverables in motion' },
  { id: 'pending-review', label: 'Pending Review', value: '8', detail: 'Items waiting for approval' },
  { id: 'scheduled', label: 'Scheduled', value: '12', detail: 'Posts and publications planned' },
  { id: 'brand-alerts', label: 'Brand Alerts', value: '3', detail: 'Items needing governance check' },
];

export const phase8ProductionQueue: Phase8QueueItem[] = [
  { id: 'q1', title: 'Home care brochure refresh', owner: 'Content Lead', status: 'review', priority: 'high', dueDate: 'This week' },
  { id: 'q2', title: 'Instagram carousel for family care', owner: 'Designer', status: 'draft', priority: 'medium', dueDate: 'Today' },
  { id: 'q3', title: 'Service landing page copy', owner: 'Copywriter', status: 'blocked', priority: 'urgent', dueDate: 'Overdue' },
  { id: 'q4', title: 'LinkedIn brand post', owner: 'Marketing', status: 'approved', priority: 'low', dueDate: 'Tomorrow' },
];

export const phase8Assets: Phase8AssetItem[] = [
  { id: 'a1', title: 'AngelCare service brochure', format: 'pdf', campaign: 'Core Services', status: 'approved', language: 'fr' },
  { id: 'a2', title: 'Caregiver recruitment visual', format: 'image', campaign: 'Brand Awareness', status: 'review', language: 'fr' },
  { id: 'a3', title: 'Home visit explainer video', format: 'video', campaign: 'Trust Campaign', status: 'draft', language: 'ar' },
  { id: 'a4', title: 'Partner presentation deck', format: 'presentation', campaign: 'Partnership Push', status: 'scheduled', language: 'en' },
];

export const phase8Deliverables: Phase8CampaignDeliverable[] = [
  { id: 'd1', campaign: 'Core Services', deliverable: 'Brochure', owner: 'Content Lead', readiness: 88, status: 'approved' },
  { id: 'd2', campaign: 'Core Services', deliverable: 'Social Pack', owner: 'Designer', readiness: 64, status: 'review' },
  { id: 'd3', campaign: 'Trust Campaign', deliverable: 'Video Script', owner: 'Copywriter', readiness: 47, status: 'draft' },
  { id: 'd4', campaign: 'Partnership Push', deliverable: 'Presentation', owner: 'Marketing', readiness: 76, status: 'scheduled' },
];

export const phase8ProductSheets: Phase8ProductSheet[] = [
  { id: 'p1', title: 'Home Care Service', category: 'Care Services', seoScore: 86, completeness: 92, status: 'approved' },
  { id: 'p2', title: 'Post-Hospital Support', category: 'Care Services', seoScore: 72, completeness: 81, status: 'review' },
  { id: 'p3', title: 'Family Support Package', category: 'Packages', seoScore: 58, completeness: 67, status: 'draft' },
];

export const phase8BrandItems: Phase8BrandItem[] = [
  { id: 'b1', title: 'Primary logo', type: 'logo', approved: true, notes: 'Approved master identity asset.' },
  { id: 'b2', title: 'Social carousel template', type: 'template', approved: true, notes: 'Ready for campaign reuse.' },
  { id: 'b3', title: 'Old flyer template', type: 'template', approved: false, notes: 'Needs replacement before use.' },
];