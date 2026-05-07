import { getEmailOsEnv } from './env';
import type { EmailOsDraft, EmailOsResult } from './types';

export type ProviderAdapter = {
  kind: string;
  testConnection: () => Promise<EmailOsResult>;
  syncMailbox: (mailboxAddress: string) => Promise<EmailOsResult>;
  sendDraft: (draft: EmailOsDraft) => Promise<EmailOsResult>;
};

function blocked(reason: string, message: string): EmailOsResult {
  return { status: 'blocked', blockedReason: reason, message };
}

export function createGoogleWorkspaceAdapter(): ProviderAdapter {
  return {
    kind: 'google',
    async testConnection() {
      if (!getEmailOsEnv().googleConfigured) return blocked('google_credentials_missing', 'Google Workspace OAuth credentials are missing.');
      return { status: 'ok', message: 'Google Workspace credentials detected. Implement OAuth token exchange next.' };
    },
    async syncMailbox(mailboxAddress) {
      if (!getEmailOsEnv().googleConfigured) return blocked('google_credentials_missing', 'Cannot sync Gmail until Google credentials are configured.');
      return { status: 'ok', message: `Gmail sync boundary ready for ${mailboxAddress}.` };
    },
    async sendDraft(draft) {
      if (!getEmailOsEnv().googleConfigured) return blocked('google_credentials_missing', 'Cannot send through Gmail until Google credentials are configured.');
      return { status: 'ok', message: `Gmail send boundary ready for draft ${draft.id}.` };
    },
  };
}

export function createMicrosoftGraphAdapter(): ProviderAdapter {
  return {
    kind: 'microsoft',
    async testConnection() {
      if (!getEmailOsEnv().microsoftConfigured) return blocked('microsoft_credentials_missing', 'Microsoft Graph credentials are missing.');
      return { status: 'ok', message: 'Microsoft Graph credentials detected. Implement Graph token exchange next.' };
    },
    async syncMailbox(mailboxAddress) {
      if (!getEmailOsEnv().microsoftConfigured) return blocked('microsoft_credentials_missing', 'Cannot sync Microsoft mailbox until Graph credentials are configured.');
      return { status: 'ok', message: `Microsoft Graph sync boundary ready for ${mailboxAddress}.` };
    },
    async sendDraft(draft) {
      if (!getEmailOsEnv().microsoftConfigured) return blocked('microsoft_credentials_missing', 'Cannot send through Microsoft Graph until credentials are configured.');
      return { status: 'ok', message: `Microsoft Graph send boundary ready for draft ${draft.id}.` };
    },
  };
}

export function createSmtpImapAdapter(): ProviderAdapter {
  return {
    kind: 'smtp_imap',
    async testConnection() {
      const env = getEmailOsEnv();
      if (!env.smtpConfigured || !env.imapConfigured) return blocked('smtp_imap_credentials_missing', 'SMTP/IMAP host, user, and password are required.');
      return { status: 'ok', message: 'SMTP/IMAP credentials detected. Implement nodemailer/imapflow binding next.' };
    },
    async syncMailbox(mailboxAddress) {
      if (!getEmailOsEnv().imapConfigured) return blocked('imap_credentials_missing', 'Cannot sync inbound mail until IMAP credentials are configured.');
      return { status: 'ok', message: `IMAP sync boundary ready for ${mailboxAddress}.` };
    },
    async sendDraft(draft) {
      if (!getEmailOsEnv().smtpConfigured) return blocked('smtp_credentials_missing', 'Cannot send until SMTP credentials are configured.');
      return { status: 'ok', message: `SMTP send boundary ready for draft ${draft.id}.` };
    },
  };
}

export function adapterFor(provider: string): ProviderAdapter {
  if (provider === 'google') return createGoogleWorkspaceAdapter();
  if (provider === 'microsoft') return createMicrosoftGraphAdapter();
  return createSmtpImapAdapter();
}
