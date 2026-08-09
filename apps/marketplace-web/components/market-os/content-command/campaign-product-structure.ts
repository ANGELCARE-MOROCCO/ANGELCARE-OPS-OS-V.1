export type CampaignStatus = 'draft' | 'active' | 'review' | 'completed';

export interface CampaignDeliverable {
  id: string;
  title: string;
  type: string;
  status: CampaignStatus;
}

export interface ProductSheet {
  id: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
}
