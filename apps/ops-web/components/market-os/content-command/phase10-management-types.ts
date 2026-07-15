export type Phase10EntityType = 'asset' | 'deliverable' | 'product_sheet' | 'brand_asset' | 'social_post';
export type Phase10EntityStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';

export interface Phase10ManagedEntity {
  id: string;
  type: Phase10EntityType;
  title: string;
  owner: string;
  status: Phase10EntityStatus;
  campaign?: string;
  language?: 'fr' | 'ar' | 'en';
  updatedAt: string;
}

export interface Phase10FormField {
  key: keyof Phase10ManagedEntity;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface Phase10ValidationResult {
  valid: boolean;
  errors: string[];
}