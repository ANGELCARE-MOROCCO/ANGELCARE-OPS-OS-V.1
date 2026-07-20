import { commonAssigneeFields, commonDocumentFields, commonLanguageFields, commonNameFields, commonPhoneFields, commonPriorityFields, commonStageFields, type WhatsAppModuleAdapter } from "./base"
export const b2bAdapter: WhatsAppModuleAdapter = {
  id: "b2b", moduleLabel: "B2B Partnerships",
  contextTypes: ["b2b_prospect", "b2b_partner", "commercial_opportunity"],
  tableCandidates: ["b2b_prospects", "b2b_accounts", "b2b_partners", "commercial_opportunities", "prospects", "organizations"],
  nameFields: ["organization_name", "prospect_name", "partner_name", ...commonNameFields], phoneFields: commonPhoneFields,
  stageFields: commonStageFields, assigneeFields: commonAssigneeFields, priorityFields: commonPriorityFields,
  languageFields: commonLanguageFields, documentFields: ["proposal_url", "quotation_url", ...commonDocumentFields],
  sourceRoute: (type,id) => type === "commercial_opportunity" ? `/b2b-partnerships?opportunity=${id}` : `/b2b-partnerships?entity=${id}`,
  defaultPurpose: "Prise de contact commerciale", defaultOutcome: "Obtenir une prochaine étape commerciale claire",
  defaultMessage: "Bonjour {{contact_first_name}},\n\nJe vous contacte au nom d’ANGELCARE concernant {{entity_name}}. Seriez-vous disponible pour un échange court afin de convenir des prochaines étapes ?\n\nBien cordialement,\n{{operator_name}}\nANGELCARE",
}
