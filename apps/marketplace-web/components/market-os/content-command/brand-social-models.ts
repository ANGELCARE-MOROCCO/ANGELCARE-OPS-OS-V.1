export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube';

export type ApprovalState =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published';

export interface EditorialCalendarItem {
  id: string;
  title: string;
  platform: SocialPlatform;
  scheduledAt?: string;
  state: ApprovalState;
}

export interface BrandAsset {
  id: string;
  name: string;
  category: 'logo' | 'font' | 'template' | 'color';
  approved: boolean;
}
