export function getDefaultMenaraProviderProfile() {
  return {
    name: "Menara Maroc Telecom",
    providerType: "smtp_imap",
    smtpHost: process.env.EMAIL_OS_SMTP_HOST || process.env.MENARA_SMTP_HOST || "smtp-auth.menara.ma",
    smtpPort: Number(process.env.EMAIL_OS_SMTP_PORT || process.env.MENARA_SMTP_PORT || 587),
    smtpSecure: false,
    imapHost: process.env.EMAIL_OS_IMAP_HOST || process.env.MENARA_IMAP_HOST || "imap.menara.ma",
    imapPort: Number(process.env.EMAIL_OS_IMAP_PORT || process.env.MENARA_IMAP_PORT || 993),
    imapSecure: true,
    isDefault: true,
    status: "active"
  }
}
