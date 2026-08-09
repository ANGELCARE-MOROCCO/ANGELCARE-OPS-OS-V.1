import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const operationsAdapter: WhatsAppModuleAdapter = {
  id: "operations", moduleLabel: "Opérations", contextTypes: ["incident", "appointment"],
  tableCandidates: ["operational_incidents", "incidents", "carelink_missions", "missions", "appointments", "calendar_appointments"],
  nameFields: ["incident_title", "mission_title", "appointment_title", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["evidence_url", ...commonDocumentFields],
  sourceRoute: (type,id) => type === "incident" ? `/operations/incidents?incident=${id}` : `/appointments?appointment=${id}`,
  defaultPurpose: "Coordination opérationnelle", defaultOutcome: "Obtenir une confirmation opérationnelle fiable",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nANGELCARE vous contacte concernant {{entity_name}}. Merci de nous confirmer rapidement la bonne réception et votre disponibilité pour la prochaine action opérationnelle.\n\n{{operator_name}}",
  fallbackPriority: "high",
}
