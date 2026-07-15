import { PHASE6_FIELD_REPLACEMENTS } from "./phase6-module-field-map";

export function buildPhase6Report() {
  const grouped = PHASE6_FIELD_REPLACEMENTS.reduce<Record<string, number>>((acc, item) => {
    acc[item.moduleKey] = (acc[item.moduleKey] ?? 0) + 1;
    return acc;
  }, {});

  return {
    phase: 6,
    title: "SaaS Factory Module Live Field Adoption",
    replacementCount: PHASE6_FIELD_REPLACEMENTS.length,
    grouped,
    replacements: PHASE6_FIELD_REPLACEMENTS,
    nextExecutionRule:
      "Run the phase6 codemod in dry-run mode first. Apply only safe replacements with backups enabled.",
  };
}
