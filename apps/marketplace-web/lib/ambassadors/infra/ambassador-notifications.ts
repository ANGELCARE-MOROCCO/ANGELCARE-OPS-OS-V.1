export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';

export type AmbassadorNotification = {
  recipientId: string;
  channel: NotificationChannel;
  templateKey: string;
  payload: Record<string, string | number | boolean | null>;
};

export function buildNotification(input: AmbassadorNotification): AmbassadorNotification & { status: 'queued'; createdAt: string } {
  return {
    ...input,
    status: 'queued',
    createdAt: new Date().toISOString()
  };
}
