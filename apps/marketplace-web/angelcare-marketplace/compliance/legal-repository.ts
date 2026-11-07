import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { loadPublishedExperience } from "../public-universe/repository";
import type { CmsBlock } from "../experience-builder/types";
import type { PublicPageExperience } from "../public-universe/types";
import {
  LEGAL_IDENTITIES,
  legalIdentity,
  selectLegalCandidate,
  text,
  type LegalKind,
  type LegalLocale,
  type LegalRow,
} from "./legal-policy";

export type LegalResolution =
  | {
      status: "published";
      experience: PublicPageExperience;
      sourceLocale: LegalLocale;
    }
  | { status: "missing" | "unavailable"; reason: string };

/** No mutable CMS block fallback, automatic publication or cross-territory widening. */
const readPublishedLegal = cache(
  async (kind: LegalKind, locale: LegalLocale): Promise<LegalResolution> => {
    try {
      const db = await createServiceClient(),
        identity = LEGAL_IDENTITIES[kind];
      const readCandidates = async (
        column: "published_slug" | "slug" | "route_key",
        values: readonly string[],
      ): Promise<LegalRow[]> => {
        const result: LegalRow[] = [];
        for (let offset = 0; ; offset += 100) {
          const page = await db
            .from("angelcare_marketplace_cms_pages")
            .select("*")
            .in(column, [...values])
            .order("id")
            .range(offset, offset + 99);
          if (page.error) {
            if (column === "published_slug" && page.error.code === "42703")
              return [];
            throw new Error("LEGAL_CANDIDATE_READ_FAILED");
          }
          const rows = Array.isArray(page.data)
            ? (page.data as unknown as LegalRow[])
            : [];
          result.push(...rows);
          if (rows.length < 100) return result;
        }
      };
      const [modern, slugs, keys, territory] = await Promise.all([
        readCandidates("published_slug", identity.slugs),
        readCandidates("slug", identity.slugs),
        readCandidates("route_key", identity.keys),
        db
          .from("angelcare_marketplace_territories")
          .select("id")
          .eq("territory_code", "MA-MASTER")
          .maybeSingle(),
      ]);
      if (territory.error) throw new Error("LEGAL_TERRITORY_READ_FAILED");
      const territoryId = territory.data?.id ? String(territory.data.id) : null;
      const rows = [...modern, ...slugs, ...keys];
      for (const sourceLocale of [...new Set<LegalLocale>([locale, "fr"])]) {
        const selection = selectLegalCandidate(
          kind,
          sourceLocale,
          territoryId,
          rows,
        );
        if (selection.status === "missing") continue;
        if (selection.status === "ambiguous")
          throw new Error("LEGAL_PUBLISHED_AUTHORITY_AMBIGUOUS");
        const published = await loadPublishedExperience(selection.page, {
          requirePublishedRevision: true,
        });
        // Validate the immutable snapshot too. Mutable draft metadata cannot switch a legal document's purpose.
        const snapshot = published.page as unknown as LegalRow;
        if (
          !legalIdentity(kind, { ...snapshot, published_slug: undefined }) ||
          text(snapshot.locale) !== sourceLocale ||
          (text(snapshot.territory_id) &&
            text(snapshot.territory_id) !== territoryId)
        )
          throw new Error("LEGAL_PUBLISHED_SNAPSHOT_MISMATCH");
        const blocks = visibleLegalBlocks(published.blocks);
        if (!hasLegalMaterial(blocks))
          throw new Error("LEGAL_PUBLISHED_DOCUMENT_EMPTY");
        return {
          status: "published",
          sourceLocale,
          experience: { page: published.page, blocks, navigation: [] },
        };
      }
      return { status: "missing", reason: "NO_ELIGIBLE_PUBLISHED_DOCUMENT" };
    } catch (error) {
      const reason =
        error instanceof Error && /^LEGAL_[A-Z_]+$/.test(error.message)
          ? error.message
          : "LEGAL_PUBLISHED_DOCUMENT_READ_FAILED";
      // Internal operational signal only. Never log document bodies, contacts, credentials or database error details.
      console.error("[AC-LEGAL-WEB-R2]", kind, locale, reason);
      return { status: "unavailable", reason };
    }
  },
);

/** Hiding a parent also hides its descendants; no orphan/cyclic child is promoted into a legal document. */
export function visibleLegalBlocks(blocks: readonly CmsBlock[]): CmsBlock[] {
  const byKey = new Map(blocks.map((b) => [b.block_key, b]));
  return blocks.filter((block) => {
    const seen = new Set<string>();
    let current: CmsBlock | undefined = block;
    while (current) {
      if (
        current.status === "hidden" ||
        current.status === "archived" ||
        seen.has(current.block_key)
      )
        return false;
      seen.add(current.block_key);
      if (!current.parent_block_key) return true;
      current = byKey.get(current.parent_block_key);
      if (!current) return false;
    }
    return false;
  });
}

/** A published shell containing only a heading or buttons is not a readable policy. */
export function hasLegalMaterial(blocks: readonly CmsBlock[]): boolean {
  const visit = (value: unknown, depth = 0): boolean => {
    if (!value || depth > 8) return false;
    if (Array.isArray(value)) return value.some((v) => visit(v, depth + 1));
    if (typeof value !== "object") return false;
    return Object.entries(value).some(
      ([key, v]) =>
        (typeof v === "string" &&
          [
            "body",
            "text",
            "lead",
            "description",
            "answer",
            "markdown",
            "mediaUrl",
            "downloadUrl",
          ].includes(key) &&
          v.trim().length > 0) ||
        (typeof v === "object" && visit(v, depth + 1)),
    );
  };
  return blocks.some(
    (b) =>
      visit(b.content) ||
      (b.block_type === "download" &&
        ["href", "ctaHref"].some(
          (k) =>
            typeof b.content[k] === "string" &&
            String(b.content[k]).trim().length > 0,
        )),
  );
}

/** Bounded read preference: a stalled CMS lookup cannot prevent native information from rendering. */
export function resolveLegalWithin(
  operation: Promise<LegalResolution>,
  milliseconds = 2500,
): Promise<LegalResolution> {
  return new Promise((resolve) => {
    const timer = setTimeout(
      () =>
        resolve({
          status: "unavailable",
          reason: "LEGAL_PUBLISHED_DOCUMENT_TIMEOUT",
        }),
      milliseconds,
    );
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve({
          status: "unavailable",
          reason: "LEGAL_PUBLISHED_DOCUMENT_READ_FAILED",
        });
      },
    );
  });
}
export const resolvePublishedLegal = cache(
  async (kind: LegalKind, locale: LegalLocale): Promise<LegalResolution> =>
    resolveLegalWithin(readPublishedLegal(kind, locale)),
);
