import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const financeAdapter: WhatsAppModuleAdapter = {
  id: "finance", moduleLabel: "Commercial & Finance",
  contextTypes: ["quotation", "invoice", "payment_followup"],
  tableCandidates: ["quotations", "commercial_quotations", "offers", "invoices", "payment_followups", "payments"],
  nameFields: ["customer_name", "organization_name", "reference", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["quotation_url", "invoice_url", "payment_link", ...commonDocumentFields],
  sourceRoute: (type,id) => type === "invoice" ? `/finance?invoice=${id}` : `/b2b-partnerships?commercial=${id}`,
  defaultPurpose: "Suivi commercial et financier", defaultOutcome: "Obtenir une décision ou un engagement daté",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nNous revenons vers vous au nom d’ANGELCARE concernant {{entity_name}}. Merci de nous confirmer la bonne réception et la date prévue pour la prochaine étape.\n\nCordialement,\n{{operator_name}}",
  fallbackPriority: "high",
}
