export type EmailOsActionPayload = {
  action: string;
  target?: string;
  mailbox?: string;
  metadata?: Record<string, unknown>;
};

export type EmailOsApiResult = {
  ok: boolean;
  action: string;
  message: string;
  receivedAt: string;
  productionBoundary: string;
};

export function buildEmailOsApiResult(payload: EmailOsActionPayload): EmailOsApiResult {
  return {
    ok: true,
    action: payload.action,
    message: `Email OS V12 action accepted: ${payload.action}`,
    receivedAt: new Date().toISOString(),
    productionBoundary: 'Backend-ready scaffold. Bind to database + provider credentials for real send/receive.',
  };
}

export const requiredEmailOsEnv = [
  'EMAIL_OS_DATABASE_URL',
  'EMAIL_OS_PROVIDER_MODE',
  'EMAIL_OS_GOOGLE_CLIENT_ID',
  'EMAIL_OS_GOOGLE_CLIENT_SECRET',
  'EMAIL_OS_MICROSOFT_CLIENT_ID',
  'EMAIL_OS_MICROSOFT_CLIENT_SECRET',
  'EMAIL_OS_SMTP_HOST',
  'EMAIL_OS_SMTP_PORT',
  'EMAIL_OS_IMAP_HOST',
  'EMAIL_OS_IMAP_PORT',
];

export function inspectEmailOsEnvironment() {
  return requiredEmailOsEnv.map((key) => ({ key, configured: Boolean(process.env[key]) }));
}
