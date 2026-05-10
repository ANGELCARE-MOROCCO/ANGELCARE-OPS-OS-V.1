export interface PublishingProvider {
  id: string;
  queue(input: {
    publicationId: string;
    channel: string;
    payload: Record<string, unknown>;
  }): Promise<{ ok: boolean; providerReference?: string; error?: string }>;
}

export const manualPublishingProvider: PublishingProvider = {
  id: 'manual',
  async queue(input) {
    return {
      ok: true,
      providerReference: `manual-${input.publicationId}`,
    };
  },
};