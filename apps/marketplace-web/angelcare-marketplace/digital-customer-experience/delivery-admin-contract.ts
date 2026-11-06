import { familyByKey } from "./registry";
import { AUDIENCES } from "./types";
import {
  DELIVERY_CONTRACT,
  collectionAppliesToDelivery,
  fieldAppliesToDelivery,
} from "./delivery-contract";
export function deliveryAdminContract(key: string) {
  const family = familyByKey(key);
  if (!family) throw Error("UNKNOWN_DELIVERY_FAMILY");
  const data = { delivery: { kind: "html" } };
  return {
    contract: DELIVERY_CONTRACT,
    family: { key: family.key, name: family.name },
    audiences: AUDIENCES,
    nativeModes: family.modes,
    actions: family.capabilities || family.actions,
    fields: family.fields.map((f) => ({
      ...f,
      htmlApplicable: fieldAppliesToDelivery(f.key, data, family),
    })),
    collections: family.collections.map((c) => ({
      ...c,
      htmlApplicable: collectionAppliesToDelivery(c.key, data),
    })),
    references: {
      topic: "Existing scoped topic UUID",
      templateId: "Existing scoped template UUID",
      coverAssetId: "Verified native PNG image UUID",
      collection_key:
        "Stable collection key; existing roots are reused on an exact scoped match",
    },
    package: {
      contract: "KIDFLIX_UNIVERSAL_INTERACTIVE",
      family_key: family.key,
      target_locale: "fr",
      required_locales: ["fr"],
      title: "",
      runtime: { kind: "sandboxed-web-app", entry: "index.html" },
      branding: {
        provider: "kidflix-host",
        official_logo_required: true,
        copyright_required: true,
      },
      copyright: { holder: "", license: "" },
      audience: { age_min: 1, age_max: 6 },
      cover: "assets/cover.png",
      catalogue: {
        collection_key: "",
        subtype: "",
        topic_id: "",
        subject: "",
        storefrontFocus: "",
        storefrontThemes: "",
        storefrontNeeds: "",
        storefrontQuick: "",
      },
      editorial: {
        summary: "",
        instructions: "",
        learningObjectives: "",
        caregiverGuidance: "",
        seoDescription: "",
      },
    },
    limits: {
      archiveBytes: 64 * 1024 * 1024,
      expandedBytes: 160 * 1024 * 1024,
      fileBytes: 36 * 1024 * 1024,
      fileCount: 1600,
      transferChunkBytes: 4 * 1024 * 1024,
    },
    note: "Schema reference only. Empty rights/title are not an importable package. Select values from each field’s own options. Native references must resolve in this scope. HTML never creates native cards implicitly.",
  };
}
