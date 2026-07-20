import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const academyAdapter: WhatsAppModuleAdapter = {
  id: "academy", moduleLabel: "ANGELCARE Academy",
  contextTypes: ["academy_learner", "academy_partner"],
  tableCandidates: ["academy_learners", "academy_partners", "training_learners", "training_partners", "trn_learners", "trn_partners"],
  nameFields: ["learner_name", "participant_name", "partner_name", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["certificate_url", "program_url", ...commonDocumentFields],
  sourceRoute: (_type,id) => `/traininghub?entity=${id}`,
  defaultPurpose: "Suivi Academy", defaultOutcome: "Confirmer l’action de formation ou la prochaine étape",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nANGELCARE Academy vous contacte au sujet de {{entity_name}}. Nous souhaitons confirmer avec vous la prochaine étape et nous assurer que vous disposez de toutes les informations nécessaires.\n\nCordialement,\n{{operator_name}}",
}
