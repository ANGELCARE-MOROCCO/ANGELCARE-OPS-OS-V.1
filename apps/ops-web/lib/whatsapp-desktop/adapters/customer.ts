import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const customerAdapter: WhatsAppModuleAdapter = {
  id: "customer", moduleLabel: "Clients & Parents",
  contextTypes: ["parent", "customer"], tableCandidates: ["parents", "customers", "parent_profiles", "customer_profiles", "angelcare_customers", "service_requests"],
  nameFields: ["parent_name", "customer_name", ...commonNameFields], phoneFields: ["parent_phone", "customer_phone", ...commonPhoneFields],
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: commonDocumentFields,
  sourceRoute: (type,id) => type === "parent" ? `/customers/parents/${id}` : `/customers/${id}`,
  defaultPurpose: "Suivi client", defaultOutcome: "Résoudre la demande et confirmer la prochaine étape",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nNous vous contactons au nom d’ANGELCARE concernant votre dossier {{entity_name}}. Notre équipe reste à votre disposition et souhaite confirmer avec vous la prochaine étape.\n\nCordialement,\n{{operator_name}}",
}
