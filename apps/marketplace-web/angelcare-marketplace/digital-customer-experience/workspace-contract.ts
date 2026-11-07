import type { Tri } from "./types";
/** Every legacy section retains its own renderer inside one horizontal workspace. */
export const WORKSPACES: readonly {
  key: string;
  label: Tri;
  sections: readonly string[];
}[] = [
  {
    key: "source",
    label: ["Content", "Contenu", "المحتوى"],
    sections: ["source", "content", "media", "experience", "design", "journey"],
  },
  {
    key: "organisation",
    label: ["Organisation", "Organisation", "التنظيم"],
    sections: ["overview", "access", "connections", "team", "history"],
  },
  {
    key: "preview",
    label: ["Preview", "Aperçu", "المعاينة"],
    sections: ["preview"],
  },
  {
    key: "publication",
    label: ["Publication", "Publication", "النشر"],
    sections: ["delivery", "validation"],
  },
];
export function workspaceForSection(section: string) {
  return WORKSPACES.find((w) => w.sections.includes(section)) || WORKSPACES[1];
}

export const organisationFieldKey = (key:string) => ["subtype","subject"].includes(key) || /^(storefront|document)/.test(key);
