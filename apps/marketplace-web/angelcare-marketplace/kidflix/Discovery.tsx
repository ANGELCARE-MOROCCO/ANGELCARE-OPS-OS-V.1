"use client";
import { PersonalLibrary, PersonalShelf } from "./personal/PersonalLibrary";
import type { Locale } from "./catalogue";
export { Explorer, WorldReadFailure as ReadFailure } from "./world/Explorer";
export function SavedDiscoveries({
  locale,
  recent = false,
  compact = false,
  dense = false,
}: {
  locale: Locale;
  recent?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  return compact ? (
    <PersonalShelf locale={locale} recent={recent} dense={dense} />
  ) : (
    <PersonalLibrary locale={locale} initialTab={recent ? "recent" : "saved"} />
  );
}
