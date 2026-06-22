export type Phase22TriggerType =
  | 'asset_uploaded'
  | 'approval_completed'
  | 'campaign_created';

export type Phase22AutomationAction =
  | 'send_notification'
  | 'assign_review'
  | 'queue_publication';

export interface Phase22AutomationRule {
  id: string;
  title: string;
  trigger: Phase22TriggerType;
  action: Phase22AutomationAction;
  enabled: boolean;
  owner: string;
}

export interface Phase22ExecutionLog {
  id: string;
  ruleId: string;
  status: 'success' | 'failed' | 'pending';
  executedAt: string;
  notes: string;
}