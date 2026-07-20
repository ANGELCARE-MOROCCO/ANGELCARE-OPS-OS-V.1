import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const trainingHubAdapter: WhatsAppModuleAdapter = {
  id: "traininghub", moduleLabel: "TrainingHub",
  contextTypes: ["training_session"], tableCandidates: ["trn_sessions", "training_sessions", "academy_sessions", "course_sessions"],
  nameFields: ["session_name", "course_name", "program_name", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["session_document_url", "course_material_url", ...commonDocumentFields],
  sourceRoute: (_type,id) => `/traininghub?session=${id}`,
  defaultPurpose: "Coordination de session", defaultOutcome: "Obtenir une confirmation de participation",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nNous vous confirmons les informations relatives à la session {{entity_name}}. Merci de nous confirmer votre disponibilité et la bonne réception des éléments transmis.\n\nANGELCARE Academy",
}
