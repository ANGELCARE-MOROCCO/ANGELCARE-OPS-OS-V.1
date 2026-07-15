export interface Phase20AiProviderReadiness {
  id: string;
  provider: string;
  ready: boolean;
  notes: string;
}

export const phase20AiProviderReadiness: Phase20AiProviderReadiness[] = [
  {
    id: 'provider-local',
    provider: 'Local prompt orchestration',
    ready: true,
    notes: 'Prompt templates, tasks, outputs, and review gates are modeled locally.',
  },
  {
    id: 'provider-openai',
    provider: 'OpenAI execution',
    ready: false,
    notes: 'Can be connected later through a protected API route with server-side keys.',
  },
  {
    id: 'provider-storage',
    provider: 'Output persistence',
    ready: false,
    notes: 'AI output storage should later map to the Content Command Center data layer.',
  },
  {
    id: 'provider-automation',
    provider: 'Automation trigger execution',
    ready: false,
    notes: 'AI tasks can later be triggered by campaign creation, asset upload, or review requests.',
  },
];