import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const recruitmentAdapter: WhatsAppModuleAdapter = {
  id: "recruitment", moduleLabel: "Recrutement & RH", contextTypes: ["recruitment_candidate"],
  tableCandidates: ["recruitment_candidates", "candidates", "job_applications", "applicants"],
  nameFields: ["candidate_name", "applicant_name", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["resume_url", "cv_url", ...commonDocumentFields],
  sourceRoute: (_type,id) => `/recruitment?candidate=${id}`,
  defaultPurpose: "Suivi de candidature", defaultOutcome: "Confirmer la prochaine étape du recrutement",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nNous vous contactons au nom d’ANGELCARE concernant votre candidature {{entity_name}}. Merci de nous confirmer votre disponibilité pour la prochaine étape.\n\nÉquipe Ressources Humaines ANGELCARE",
}
