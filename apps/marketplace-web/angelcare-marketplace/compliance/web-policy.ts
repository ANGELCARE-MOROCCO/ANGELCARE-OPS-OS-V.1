import type { LegalKind, LegalLocale } from "./legal-policy";
import content from "./web-policy-content.json";
import cookies from "./web-cookie-content.json";
export const WEB_POLICY_VERSION = "2026-11-R2";
export interface WebPolicy {
  title: string;
  lead: string;
  sections: { id: string; title: string; paragraphs: string[] }[];
}
export function webPolicy(kind: LegalKind, locale: LegalLocale): WebPolicy {
  const raw = kind === "cookies" ? cookies[locale] : content[locale][kind];
  return {
    title: raw.title,
    lead: raw.lead,
    sections: raw.sections.map((s, i) => ({
      id: kind + "-" + (i + 1),
      title: s[0],
      paragraphs: s.slice(1),
    })),
  };
}
