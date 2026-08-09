import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const admissionsAdapter: WhatsAppModuleAdapter = {
  id: "admissions", moduleLabel: "Admissions", contextTypes: ["admission"],
  tableCandidates: ["admissions", "admission_applications", "student_admissions", "admission_enquiries", "enquiries"],
  nameFields: ["applicant_name", "student_name", "parent_name", ...commonNameFields], phoneFields: ["parent_phone", "applicant_phone", ...commonPhoneFields],
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["application_url", "registration_url", ...commonDocumentFields],
  sourceRoute: (_type,id) => `/admissions?dossier=${id}`,
  defaultPurpose: "Suivi admission", defaultOutcome: "Faire progresser le dossier d’admission",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nNous revenons vers vous au sujet du dossier d’admission {{entity_name}}. Merci de nous confirmer votre disponibilité afin de finaliser les éléments en attente.\n\nÉquipe Admissions ANGELCARE",
}
