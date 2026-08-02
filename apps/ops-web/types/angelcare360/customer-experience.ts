export type CustomerToastTone = 'processing' | 'success' | 'warning' | 'error' | 'info'
export interface CustomerToastInput { id?: string; title: string; message?: string; tone?: CustomerToastTone; progress?: number; durationMs?: number; persistent?: boolean }
export interface CustomerToastRecord extends Required<Pick<CustomerToastInput,'id'|'title'|'tone'|'durationMs'|'persistent'>> { message?: string; progress?: number; createdAt: number }
export interface CustomerPlaneDefinition { key: string; label: string; description?: string; permission?: string; entitlementKey?: string; disabled?: boolean }
