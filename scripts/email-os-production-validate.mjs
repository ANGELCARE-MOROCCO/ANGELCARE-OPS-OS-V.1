const required = [
  'EMAIL_CREDENTIAL_SECRET',
  'MENARA_IMAP_HOST',
  'MENARA_IMAP_PORT',
  'MENARA_SMTP_HOST',
  'MENARA_SMTP_PORT',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error('Missing required env:', missing.join(', '));
  process.exit(1);
}

const passwordMissing = [];
for (let i = 1; i <= 13; i++) {
  const key = `EMAIL_MBX_${String(i).padStart(2, '0')}_PASSWORD`;
  if (!process.env[key] || process.env[key] === 'PUT_PASSWORD_IN_ENV_ONLY') passwordMissing.push(key);
}

if (passwordMissing.length) {
  console.error('Missing mailbox passwords:', passwordMissing.join(', '));
  process.exit(1);
}

console.log('Email OS production env validation passed.');
