const keys = ['EMAIL_CREDENTIAL_SECRET','MENARA_IMAP_HOST','MENARA_IMAP_PORT','MENARA_SMTP_HOST','MENARA_SMTP_PORT'];
const missing = keys.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required env:', missing.join(', '));
  process.exit(1);
}
for (let i=1;i<=13;i++) {
  const k = `EMAIL_MBX_${String(i).padStart(2,'0')}_PASSWORD`;
  if (!process.env[k]) console.warn('Missing mailbox password:', k);
}
console.log('Email OS env validation complete.');
