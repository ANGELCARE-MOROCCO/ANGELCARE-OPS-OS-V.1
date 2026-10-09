"use client";
import type { StorefrontExperience } from "../catalog-discovery/types";
import {
  emptyNative,
  type NativeContext,
} from "../storefront-immersive/native-context";
import { isBusinessKey } from "./content";
import { WorldFrame } from "./Shared";
import { Corporates } from "./Corporates";
import { Establishments } from "./Establishments";
import { HealthPartners } from "./HealthPartners";
import { Hospitality } from "./Hospitality";
import { PartnerOS } from "./PartnerOS";
import { Professionals } from "./Professionals";
import { QualityCheck } from "./QualityCheck";
export function BusinessWorlds({
  experience,
  native = emptyNative(),
  builtinWorldId = null,
}: {
  experience: StorefrontExperience;
  native?: NativeContext;
  builtinWorldId?: string | null;
}) {
  if (!isBusinessKey(experience.key)) return null;
  const Component = {
    corporates: Corporates,
    establishments: Establishments,
    "health-partners": HealthPartners,
    hospitality: Hospitality,
    "partner-os": PartnerOS,
    professionals: Professionals,
    "quality-check": QualityCheck,
  }[experience.key];
  return (
    <WorldFrame
      world={experience.key}
      experience={experience}
      native={native}
      builtinWorldId={builtinWorldId}
    >
      <Component />
    </WorldFrame>
  );
}
