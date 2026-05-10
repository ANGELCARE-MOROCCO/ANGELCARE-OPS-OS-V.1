export interface AiRuntimeRequest {
  action: 'rewrite' | 'translate' | 'seo_optimize' | 'caption' | 'quality_score';
  input: string;
  language?: 'fr' | 'ar' | 'en';
}

export async function runContentCommandAiRuntime(_request: AiRuntimeRequest) {
  // Server-only placeholder.
  // Wire OpenAI/provider here after review gates and audit are ready.
  return {
    ok: false,
    error: 'AI runtime provider not connected yet.',
  };
}