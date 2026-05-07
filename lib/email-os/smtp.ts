import nodemailer from 'nodemailer';

type EmailAccountLike = {
  password?: string | null;
  smtp_password?: string | null;
  plain_password?: string | null;
  encrypted_password?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | string | null;
  smtp_secure?: boolean | null;
  username?: string | null;
  email_address?: string | null;
  signature_name?: string | null;
  mailbox_name?: string | null;
};

type SendMailInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
};

function resolvePassword(account: EmailAccountLike): string {
  return (
    account?.password ||
    account?.smtp_password ||
    account?.plain_password ||
    account?.encrypted_password ||
    ''
  );
}

function createTransport(account: EmailAccountLike) {
  const password = resolvePassword(account);

  if (!password) {
    throw new Error('Missing mailbox password');
  }

  const user = account.username || account.email_address;

  if (!user) {
    throw new Error('Missing SMTP username/email address');
  }

  return nodemailer.createTransport({
    host: account.smtp_host || 'smtp-auth.menara.ma',
    port: Number(account.smtp_port || 587),
    secure: Boolean(account.smtp_secure ?? false),
    auth: {
      user,
      pass: password,
    },
  });
}

export async function testSmtpConnection(account: EmailAccountLike) {
  const transporter = createTransport(account);
  await transporter.verify();
  return true;
}

export async function sendMailViaAccount(account: EmailAccountLike, input: SendMailInput) {
  if (!Array.isArray(input.to) || input.to.length === 0) {
    throw new Error('At least one recipient is required');
  }

  const transporter = createTransport(account);

  const fromEmail = account.email_address || account.username;

  if (!fromEmail) {
    throw new Error('Missing sender email address');
  }

  return await transporter.sendMail({
    from: `"${account.signature_name || account.mailbox_name || fromEmail}" <${fromEmail}>`,
    to: input.to.join(', '),
    cc: input.cc?.join(', '),
    bcc: input.bcc?.join(', '),
    subject: input.subject || '(no subject)',
    text: input.text || '',
    html: input.html,
  });
}