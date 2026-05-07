export function getEmailOsEnv() {
  const databaseUrl = process.env.EMAIL_OS_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  return {
    databaseConfigured: Boolean(databaseUrl),
    databaseUrl,
    encryptionConfigured: Boolean(process.env.EMAIL_OS_ENCRYPTION_KEY),
    googleConfigured: Boolean(process.env.GOOGLE_WORKSPACE_CLIENT_ID && process.env.GOOGLE_WORKSPACE_CLIENT_SECRET),
    microsoftConfigured: Boolean(process.env.MICROSOFT_GRAPH_CLIENT_ID && process.env.MICROSOFT_GRAPH_CLIENT_SECRET && process.env.MICROSOFT_GRAPH_TENANT_ID),
    smtpConfigured: Boolean(process.env.EMAIL_OS_SMTP_HOST && process.env.EMAIL_OS_SMTP_USER && process.env.EMAIL_OS_SMTP_PASSWORD),
    imapConfigured: Boolean(process.env.EMAIL_OS_IMAP_HOST && process.env.EMAIL_OS_IMAP_USER && process.env.EMAIL_OS_IMAP_PASSWORD),
  };
}

export function productionBlockers() {
  const env = getEmailOsEnv();
  const blockers: string[] = [];
  if (!env.databaseConfigured) blockers.push('database_not_configured');
  if (!env.encryptionConfigured) blockers.push('credential_encryption_key_missing');
  if (!env.googleConfigured && !env.microsoftConfigured && !env.smtpConfigured) blockers.push('provider_credentials_missing');
  return blockers;
}
