import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const refferqAdapter: WhatsAppModuleAdapter = {
  id: "refferq", moduleLabel: "RefferQ", contextTypes: ["refferq_member"],
  tableCandidates: ["refferq_members", "refferq_candidates", "refferq_referrals", "refferq_profiles"],
  nameFields: ["member_name", "candidate_name", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: commonDocumentFields,
  sourceRoute: (_type,id) => `/market-os/ambassadors/refferq?member=${id}`,
  defaultPurpose: "Activation RefferQ", defaultOutcome: "Obtenir une action d’activation concrète",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nL’équipe RefferQ by ANGELCARE vous contacte au sujet de {{entity_name}}. Nous souhaitons confirmer votre disponibilité et vous accompagner dans la prochaine étape.\n\nCordialement,\n{{operator_name}}",
}
