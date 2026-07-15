export interface Phase18AttributionReadinessItem {
  id: string;
  label: string;
  ready: boolean;
  notes: string;
}

export const phase18AttributionReadiness: Phase18AttributionReadinessItem[] = [
  {
    id: 'utm-structure',
    label: 'UTM / campaign source structure',
    ready: true,
    notes: 'Attribution models can track source channel, campaign, leads, conversions, and revenue.',
  },
  {
    id: 'content-performance',
    label: 'Content performance records',
    ready: true,
    notes: 'Asset-level views, engagements, downloads, leads, conversions, and revenue are typed.',
  },
  {
    id: 'roi-summary',
    label: 'ROI summary helpers',
    ready: true,
    notes: 'Revenue, leads, conversions, and conversion-rate summaries are ready.',
  },
  {
    id: 'external-platform-ingestion',
    label: 'External platform ingestion',
    ready: false,
    notes: 'Meta, LinkedIn, TikTok, YouTube, and website analytics APIs are not connected in this phase.',
  },
  {
    id: 'database-persistence',
    label: 'Database persistence',
    ready: false,
    notes: 'Analytics models are ready to map to a database after schema creation.',
  },
];