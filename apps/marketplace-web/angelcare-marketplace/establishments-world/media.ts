/** Editorial campaign art is illustrative; live sellable photographs stay in the catalogue. */
export const CAMPAIGN_ROOT = "/angelcare-marketplace/establishments-r4/";
export const CAMPAIGN_MAP: Record<string, string> = {
  "consulting-hero": "consulting",
  "partner-hero": "partner",
  "products-hero": "products",
  "child-experience": "eduplay",
  edupplay: "eduplay",
  academy: "academy",
  parents: "parents",
  "consulting-deliverables": "operations",
  "consulting-method": "academy",
  welcome: "welcome",
  signage: "welcome",
  classroom: "classroom",
  administration: "operations",
  safety: "operations",
  activities: "eduplay",
  furniture: "classroom",
  "parent-tools": "parents",
  inclusion: "eduplay",
  uniforms: "team",
  audit: "operations",
  "os-overview": "partner",
  "os-admissions": "parents",
  "os-communication": "parents",
  "os-activities": "eduplay",
  "os-crm": "parents",
  "os-services": "products",
  "os-quotes": "operations",
  "os-finance": "operations",
  "os-payments": "operations",
  "os-team": "academy",
  "programme-team": "academy",
  "programme-coaching": "academy",
  "parent-direction": "consulting",
  "os-people-intro": "academy",
  "os-people-direction": "partner",
  "os-people-admissions": "parents",
  "os-people-commerce": "consulting",
  "os-people-team": "academy",
  "os-people-followup": "operations",
  "os-people-year": "partner",
};
export function campaignAsset(name: string, width: 640 | 960 | 1536 = 1536) {
  const key = CAMPAIGN_MAP[name];
  if (!key)
    throw new Error(`Unknown Établissements campaign placement: ${name}`);
  return `${CAMPAIGN_ROOT}${key}-campaign${width === 1536 ? "" : `-${width}`}.png`;
}
export function campaignSet(name: string) {
  return `${campaignAsset(name, 640)} 640w, ${campaignAsset(name, 960)} 960w, ${campaignAsset(name)} 1536w`;
}
