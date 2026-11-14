import { createServiceClient } from "@/lib/supabase/server";
import {
  hasMarketplacePermission,
  requireMarketplaceApiContext,
} from "../auth/context";
import { writeMarketplaceAudit } from "../audit/write-audit";
import { MarketplaceError } from "../server/errors";
import {
  apiFailure,
  apiSuccess,
  parseJsonObject,
  requestId,
} from "../server/request";
import { refreshCommerceSurfaces } from "../commerce-studio/publication";
import {
  STOREFRONTS,
  normalizePlacement,
  placementObject,
  validatePlacement,
  type PlacementSnapshot,
} from "./model";
import { visiblePlacementCategories } from "./repository";

type Row = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" ? value : "");
export async function handleStorefrontPlacement(
  request: Request,
  itemId: string,
) {
  const rid = requestId(request);
  try {
    if (!["GET", "PATCH"].includes(request.method))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Méthode non prise en charge.",
      );
    const context = await requireMarketplaceApiContext(
      request.method === "GET"
        ? "marketplace.catalog.view"
        : "marketplace.catalog.manage",
    );
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        itemId,
      )
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Identifiant d’offre invalide.",
      );
    const db = await createServiceClient();
    const read = await db
      .from("angelcare_marketplace_catalog_items")
      .select(
        "id,name_fr,slug,status,territory_id,experience_config,updated_at,availability_status",
      )
      .eq("id", itemId)
      .maybeSingle();
    if (read.error)
      throw new MarketplaceError(
        "INTERNAL_ERROR",
        "Lecture des vitrines impossible. Votre sélection est conservée.",
      );
    if (!read.data)
      throw new MarketplaceError("NOT_FOUND", "Offre introuvable.");
    const item = read.data as Row;
    if (
      context.territoryId &&
      item.territory_id &&
      context.territoryId !== item.territory_id
    )
      throw new MarketplaceError(
        "FORBIDDEN",
        "Offre hors de votre territoire.",
      );
    // This optional control deliberately does not require a schema, kind, or publication readiness.
    async function snapshot(row: Row): Promise<PlacementSnapshot> {
      const publicIssues: PlacementSnapshot["publicIssues"] = [];
      let territoryCode: string | null = null;
      if (row.territory_id) {
        const territory = await db
          .from("angelcare_marketplace_territories")
          .select("territory_code")
          .eq("id", row.territory_id)
          .maybeSingle();
        if (territory.error)
          throw new MarketplaceError(
            "INTERNAL_ERROR",
            "Vérification du territoire impossible. Relisez la configuration enregistrée.",
          );
        territoryCode = text(territory.data?.territory_code) || null;
        if (!territoryCode)
          publicIssues.push({
            code: "UNKNOWN_TERRITORY",
            message:
              "Le territoire de cette offre ne peut pas être résolu. Vérifiez sa configuration avant de prévisualiser les vitrines.",
            section: "territories",
          });
      }
      if (row.status !== "published")
        publicIssues.push({
          code: "NOT_PUBLISHED",
          message:
            "Cette offre reste " +
            ((
              {
                draft: "en brouillon",
                paused: "en pause",
                archived: "archivée",
                cancelled: "annulée",
              } as Record<string, string>
            )[text(row.status)] ||
              text(row.status) ||
              "en brouillon") +
            ". Enregistrez vos vitrines maintenant ; elles seront prises en compte après publication.",
          section: "publication",
        });
      if (!text(row.slug))
        publicIssues.push({
          code: "NO_PUBLIC_SLUG",
          message: "L’adresse publique de cette offre est manquante.",
          section: "publication",
        });
      if (
        ["hidden", "territory_restricted", "cancelled", "suspended"].includes(
          text(row.availability_status),
        )
      )
        publicIssues.push({
          code: "PUBLIC_VISIBILITY_RESTRICTED",
          message:
            "La visibilité ou la disponibilité de cette offre empêche son exposition publique.",
          section: "availability",
        });
      const categories = await visiblePlacementCategories(
        "fr",
        text(row.territory_id) || null,
      );
      let hasPublicCategory = false;
      for (let offset = 0; ; offset += 240) {
        const result = await db
          .from("angelcare_marketplace_catalog_item_categories")
          .select("id,category_id")
          .eq("catalog_item_id", itemId)
          .order("id")
          .range(offset, offset + 239);
        if (result.error)
          throw new MarketplaceError(
            "INTERNAL_ERROR",
            "Vérification des catégories impossible. Relisez la configuration enregistrée.",
          );
        const batch = (result.data || []) as Row[];
        if (batch.some((entry) => categories.has(String(entry.category_id))))
          hasPublicCategory = true;
        if (batch.length < 240) break;
      }
      if (!hasPublicCategory)
        publicIssues.push({
          code: "NO_PUBLIC_CATEGORY",
          message:
            "Aucune catégorie publiée et visible en français. Le placement ne modifie pas vos catégories : vérifiez leurs affectations pour rendre l’offre accessible.",
          section: "categories",
        });
      return {
        itemId,
        name: text(row.name_fr),
        slug: text(row.slug),
        status: text(row.status),
        territoryCode,
        updatedAt: text(row.updated_at),
        canManage: hasMarketplacePermission(
          context,
          "marketplace.catalog.manage",
        ),
        config: normalizePlacement(
          placementObject(row.experience_config).storefront_placement,
        ),
        publicIssues,
      };
    }
    if (request.method === "GET")
      return apiSuccess(await snapshot(item), { requestId: rid });
    const body = await parseJsonObject(request),
      expected = text(body.expectedUpdatedAt);
    if (!expected || expected !== text(item.updated_at))
      throw new MarketplaceError(
        "CONFLICT",
        "Cette offre a changé. Relisez sa version actuelle ; votre sélection reste conservée.",
      );
    const errors = validatePlacement(body.config);
    if (errors.length)
      throw new MarketplaceError("VALIDATION_ERROR", errors.join(" "));
    const config = normalizePlacement(body.config),
      experience = placementObject(item.experience_config);
    const result = await db
      .from("angelcare_marketplace_catalog_items")
      .update({
        experience_config: { ...experience, storefront_placement: config },
        updated_at: new Date(
          Math.max(Date.now(), Date.parse(expected) + 1),
        ).toISOString(),
      })
      .eq("id", itemId)
      .eq("updated_at", expected)
      .select(
        "id,name_fr,slug,status,territory_id,experience_config,updated_at,availability_status",
      )
      .maybeSingle();
    if (result.error)
      throw new MarketplaceError(
        "INTERNAL_ERROR",
        "Enregistrement non confirmé. Votre sélection est conservée : relisez avant de réessayer.",
      );
    if (!result.data)
      throw new MarketplaceError(
        "CONFLICT",
        "Une autre modification a été enregistrée. Relisez la version actuelle ; votre sélection est conservée.",
      );
    const saved = result.data as Row;
    await writeMarketplaceAudit({
      context,
      requestId: rid,
      action: "marketplace.catalog.storefront_placement.updated",
      objectType: "catalog_item",
      objectId: itemId,
      beforeValue: normalizePlacement(experience.storefront_placement),
      afterValue: config,
      source: "product360-storefront-placement-v1",
      request,
    });
    const paths = ["fr", "en", "ar"].flatMap((locale) => [
      ...STOREFRONTS.map(
        (storefront) =>
          "/angelcare-marketplace/" + locale + "/" + storefront.key,
      ),
      "/angelcare-marketplace/" +
        locale +
        "/marketplace/item/" +
        encodeURIComponent(text(saved.slug)),
    ]);
    refreshCommerceSurfaces(paths);
    // Database-returned configuration is the acknowledgement; no optimistic success based on request data.
    return apiSuccess(await snapshot(saved), { requestId: rid });
  } catch (error) {
    return apiFailure(error, rid);
  }
}
