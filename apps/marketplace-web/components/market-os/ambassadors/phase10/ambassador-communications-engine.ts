import type {
  AmbassadorBroadcast,
  AmbassadorCommunicationChannel,
  AmbassadorCommunicationSnapshot,
  AmbassadorContactPreference,
  AmbassadorMessageTemplate,
} from "./ambassador-communications-types";

export type AmbassadorCommunicationMetrics = {
  activeTemplates: number;
  scheduledBroadcasts: number;
  queuedBroadcasts: number;
  sentBroadcasts: number;
  totalExpectedRecipients: number;
  totalDelivered: number;
  totalFailed: number;
  averageOpenRate: number;
  averageReplyRate: number;
  optInRiskCount: number;
  communicationReadinessScore: number;
};

export function canContactAmbassador(
  preference: AmbassadorContactPreference,
  channel: AmbassadorCommunicationChannel,
): boolean {
  if (channel === "whatsapp") return preference.whatsappOptIn;
  if (channel === "email") return preference.emailOptIn;
  if (channel === "sms") return preference.smsOptIn;
  return true;
}

export function renderTemplate(
  template: AmbassadorMessageTemplate,
  variables: Record<string, string | number>,
): string {
  return template.variables.reduce((body, variable) => {
    const value = variables[variable] ?? `{{${variable}}}`;
    return body.replaceAll(`{{${variable}}}`, String(value));
  }, template.body);
}

export function calculateAverageRate(broadcasts: AmbassadorBroadcast[], key: "openRate" | "replyRate"): number {
  const sent = broadcasts.filter((broadcast) => broadcast.status === "sent");
  if (sent.length === 0) return 0;
  const total = sent.reduce((sum, broadcast) => sum + broadcast[key], 0);
  return Math.round(total / sent.length);
}

export function getAmbassadorCommunicationMetrics(
  snapshot: AmbassadorCommunicationSnapshot,
): AmbassadorCommunicationMetrics {
  const activeTemplates = snapshot.templates.filter((template) => template.status === "active").length;
  const scheduledBroadcasts = snapshot.broadcasts.filter((broadcast) => broadcast.status === "scheduled").length;
  const queuedBroadcasts = snapshot.broadcasts.filter((broadcast) => broadcast.status === "queued").length;
  const sentBroadcasts = snapshot.broadcasts.filter((broadcast) => broadcast.status === "sent").length;
  const totalExpectedRecipients = snapshot.broadcasts.reduce((sum, broadcast) => sum + broadcast.expectedRecipients, 0);
  const totalDelivered = snapshot.broadcasts.reduce((sum, broadcast) => sum + broadcast.deliveredCount, 0);
  const totalFailed = snapshot.broadcasts.reduce((sum, broadcast) => sum + broadcast.failedCount, 0);
  const averageOpenRate = calculateAverageRate(snapshot.broadcasts, "openRate");
  const averageReplyRate = calculateAverageRate(snapshot.broadcasts, "replyRate");
  const optInRiskCount = snapshot.contactPreferences.filter((item) => item.contactRisk === "high" || !item.whatsappOptIn).length;

  const base = activeTemplates * 12 + sentBroadcasts * 8 + scheduledBroadcasts * 5 + queuedBroadcasts * 4;
  const quality = averageOpenRate + averageReplyRate;
  const penalty = totalFailed * 3 + optInRiskCount * 6;
  const communicationReadinessScore = Math.max(0, Math.min(100, Math.round((base + quality) / 2 - penalty + 20)));

  return {
    activeTemplates,
    scheduledBroadcasts,
    queuedBroadcasts,
    sentBroadcasts,
    totalExpectedRecipients,
    totalDelivered,
    totalFailed,
    averageOpenRate,
    averageReplyRate,
    optInRiskCount,
    communicationReadinessScore,
  };
}

export function getBroadcastsNeedingAttention(broadcasts: AmbassadorBroadcast[]): AmbassadorBroadcast[] {
  return broadcasts.filter(
    (broadcast) => broadcast.status === "failed" || broadcast.failedCount > 0 || broadcast.status === "queued",
  );
}
