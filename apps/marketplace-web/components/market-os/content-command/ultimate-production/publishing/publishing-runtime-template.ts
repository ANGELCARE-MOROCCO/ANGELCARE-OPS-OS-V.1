export interface PublishingRuntimeRequest {
  publicationId: string;
  channel: 'meta' | 'linkedin' | 'tiktok' | 'whatsapp' | 'email';
}

export async function queueContentCommandPublication(_request: PublishingRuntimeRequest) {
  // Server-only placeholder.
  // Never publish directly from client.
  return {
    ok: false,
    error: 'Publishing runtime provider not connected yet.',
  };
}