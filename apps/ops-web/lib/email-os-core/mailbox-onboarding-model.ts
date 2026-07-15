export type MailboxOnboardingStep =
  | "identity"
  | "provider"
  | "credentials"
  | "routing"
  | "sync"
  | "ai"
  | "security"
  | "review"

export const mailboxOnboardingSteps: { key: MailboxOnboardingStep; label: string; description: string }[] = [
  { key: "identity", label: "Identity", description: "Mailbox name, email, owner, department." },
  { key: "provider", label: "Provider", description: "SMTP and IMAP provider profile." },
  { key: "credentials", label: "Credentials", description: "Login, password reference, and validation." },
  { key: "routing", label: "Routing", description: "Inbound and outbound handling rules." },
  { key: "sync", label: "Sync", description: "Mailbox sync interval and checkpoints." },
  { key: "ai", label: "AI", description: "AI triage, replies, and risk controls." },
  { key: "security", label: "Security", description: "Permissions, vault reference, and audit." },
  { key: "review", label: "Review", description: "Final readiness before activation." }
]

export const defaultMailboxSetup = {
  name: "",
  emailAddress: "",
  owner: "operations",
  department: "Operations",
  providerProfileId: "",
  username: "",
  passwordRef: "",
  inboundRouting: "operations",
  outboundRouting: "standard",
  syncFrequencyMinutes: 15,
  enableAiTriage: true,
  enableAiDrafts: true,
  requireApprovalForHighRisk: true,
  permissionScope: "operations",
  vaultProvider: "manual",
  status: "active"
}
