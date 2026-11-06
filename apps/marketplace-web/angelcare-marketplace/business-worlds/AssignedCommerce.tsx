"use client";
import type { StorefrontExperience } from "../catalog-discovery/types";
import {
  emptyNative,
  type NativeContext,
} from "../storefront-immersive/native-context";
import { WorldFrame, useWorld } from "./Shared";
import {
  CommercialOpening,
  CommerceCatalogue,
  CommerceCollections,
  ProjectSummary,
} from "./Commerce";
import { Enquiry } from "./Enquiry";
import { businessKey, M, localized } from "./merchandising";
import c from "./commerce.module.css";

/** The published template remains intact. This explicit commerce extension gives it exhaustive, governed offer access. */
export function AssignedBusinessCommerce({
  experience,
  native = emptyNative(),
}: {
  experience: StorefrontExperience;
  native?: NativeContext;
}) {
  if (!businessKey(experience.key)) return null;
  return (
    <WorldFrame
      key={`${experience.key}:${experience.locale}:${experience.territoryCode || "all"}`}
      world={experience.key}
      experience={experience}
      native={native}
    >
      <CommercialOpening />
      <CommerceCollections />
      <CommerceCatalogue />
      <ProjectSummary />
      <AssignedEnquiry />
    </WorldFrame>
  );
}
function AssignedEnquiry() {
  const { world, locale, brief, experience } = useWorld();
  return (
    <Enquiry
      world={world}
      locale={locale}
      brief={brief}
      sourceRoute={`/angelcare-marketplace/${locale}/${world}${experience.territoryCode ? `?territory=${encodeURIComponent(experience.territoryCode)}` : ""}`}
    />
  );
}
export function AssignedBusinessAccess({
  experience,
}: {
  experience: StorefrontExperience;
}) {
  return (
    <nav
      className={c.assignedAccess}
      aria-label={localized(M.catalogue, experience.locale)}
    >
      <span>
        {experience.items.length} {localized(M.live, experience.locale)}
      </span>
      <a href="#world-offers">{localized(M.full, experience.locale)} ↗</a>
    </nav>
  );
}
