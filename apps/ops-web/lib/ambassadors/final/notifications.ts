export function buildQueuedNotification(notification: {
  recipientId: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'in_app';
  templateKey: string;
  payload: Record<string, string | number | boolean | null>;
}) {
  return {
    recipient_id: notification.recipientId,
    channel: notification.channel,
    template_key: notification.templateKey,
    payload: notification.payload,
    status: 'queued'
  };
}
