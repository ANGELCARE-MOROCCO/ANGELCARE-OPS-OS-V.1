import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const supportAdapter: WhatsAppModuleAdapter = {
  id: "support", moduleLabel: "Support Client", contextTypes: ["support_case"],
  tableCandidates: ["support_tickets", "customer_support_cases", "complaints", "reclamations", "service_cases"],
  nameFields: ["customer_name", "requester_name", "case_title", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["evidence_url", ...commonDocumentFields],
  sourceRoute: (_type,id) => `/support?case=${id}`,
  defaultPurpose: "Traitement d’une demande support", defaultOutcome: "Confirmer la résolution ou une échéance fiable",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nJe vous contacte au nom du Support Client ANGELCARE concernant votre demande {{entity_name}}. Nous souhaitons vous informer de l’avancement et confirmer avec vous la suite du traitement.\n\nCordialement,\n{{operator_name}}",
  fallbackPriority: "high",
}
