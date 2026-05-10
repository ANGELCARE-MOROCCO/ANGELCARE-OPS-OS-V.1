export type AmbassadorCommunicationChannel =
  | "whatsapp"
  | "email"
  | "sms"
  | "in_app"
  | "phone_call";

export type AmbassadorCommunicationStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "sent"
  | "failed"
  | "cancelled";

export type AmbassadorCommunicationAudience =
  | "all_ambassadors"
  | "city"
  | "program"
  | "tier"
  | "mission"
  | "risk_segment"
  | "manual_selection";

export type AmbassadorMessageTemplate = {
  id: string;
  name: string;
  channel: AmbassadorCommunicationChannel;
  category:
    | "onboarding"
    | "mission"
    | "proof_revision"
    | "reward"
    | "payout"
    | "training"
    | "compliance"
    | "announcement"
    | "motivation";
  subject: string;
  body: string;
  variables: string[];
  owner: string;
  status: "active" | "draft" | "archived";
};

export type AmbassadorBroadcast = {
  id: string;
  title: string;
  channel: AmbassadorCommunicationChannel;
  audience: AmbassadorCommunicationAudience;
  audienceLabel: string;
  templateId: string;
  status: AmbassadorCommunicationStatus;
  scheduledFor: string;
  sender: string;
  expectedRecipients: number;
  deliveredCount: number;
  failedCount: number;
  openRate: number;
  replyRate: number;
};

export type AmbassadorContactPreference = {
  ambassadorId: string;
  ambassadorName: string;
  city: string;
  preferredChannel: AmbassadorCommunicationChannel;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
  lastContactedAt: string;
  contactRisk: "low" | "medium" | "high";
};

export type AmbassadorCommunicationLog = {
  id: string;
  broadcastId: string;
  ambassadorName: string;
  channel: AmbassadorCommunicationChannel;
  status: AmbassadorCommunicationStatus;
  sentAt?: string;
  failureReason?: string;
  responseSummary?: string;
};

export type AmbassadorCommunicationSnapshot = {
  templates: AmbassadorMessageTemplate[];
  broadcasts: AmbassadorBroadcast[];
  contactPreferences: AmbassadorContactPreference[];
  logs: AmbassadorCommunicationLog[];
};
