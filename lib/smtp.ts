import { auditEmailAction } from './audit';
import { resolvePassword } from './accounts';

export async function testSmtpConnection(account: any) {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: account.smtp_host, port: Number(account.smtp_port), secure: Boolean(account.smtp_secure),
    auth: { user: account.username || account.email_address, pass: resolvePassword(account) },
  });
  await transporter.verify();
  return true;
}
export async function sendMailViaAccount(account: any, input: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; text: string; html?: string }) {
  if (!account.send_enabled) throw new Error('Sending is disabled for this mailbox');
  const password = resolvePassword(account);
  if (!password) throw new Error('Missing mailbox password');
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: account.smtp_host, port: Number(account.smtp_port), secure: Boolean(account.smtp_secure),
    auth: { user: account.username || account.email_address, pass: password },
  });
  const info = await transporter.sendMail({
    from: `"${account.signature_name || account.mailbox_name}" <${account.email_address}>`,
    to: input.to.join(', '), cc: input.cc?.join(', '), bcc: input.bcc?.join(', '),
    subject: input.subject, text: input.text, html: input.html,
  });
  await auditEmailAction({ action: 'smtp_send_completed', account_id: account.id, details: { messageId: info.messageId, to: input.to, subject: input.subject } });
  return info;
}
