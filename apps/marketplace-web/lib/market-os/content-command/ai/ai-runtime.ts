export interface ContentCommandAiRequest {
  action: 'rewrite' | 'translate' | 'seo_optimize' | 'caption' | 'quality_score';
  input: string;
  language?: 'fr' | 'ar' | 'en';
}

export async function runContentCommandAi(request: ContentCommandAiRequest) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  // Provider implementation placeholder.
  // Keep server-side only. Route output to review, never direct publish.
  return {
    action: request.action,
    output: `AI runtime placeholder for ${request.action}. Wire provider call here.`,
    qualityScore: 80,
    state: 'review_required',
  };
}