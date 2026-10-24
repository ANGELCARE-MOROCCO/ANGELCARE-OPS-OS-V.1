import { AD_FORMATS } from "./registry";
import { WORLD_FIELDS } from "./administration";
import type { Kind, Field as Definition } from "./types";
const message = (en: string, fr: string, ar: string) => [en, fr, ar] as const;
export const ROOT_FIELDS: Partial<Record<Kind, Definition[]>> = {
  topic: [
    {
      key: "parentId",
      label: message("Parent topic", "Thème parent", "الموضوع الأصلي"),
      type: "reference",
    },
    {
      key: "icon",
      label: message("Icon", "Icône", "الرمز"),
      type: "select",
      options: [
        "Heart",
        "BookOpen",
        "Leaf",
        "Palette",
        "GraduationCap",
        "Baby",
        "School",
        "Stethoscope",
      ],
    },
    {
      key: "color",
      label: message("Accent colour", "Couleur d’accent", "اللون"),
      type: "text",
    },
    {
      key: "sortOrder",
      label: message("Order", "Ordre", "الترتيب"),
      type: "number",
      min: 0,
      max: 9999,
    },
    {
      key: "visible",
      label: message(
        "Visible in topic discovery",
        "Visible dans les thèmes",
        "ظاهر في المواضيع",
      ),
      type: "toggle",
    },
  ],
  content: [
    {
      key: "body",
      label: message("Content body", "Corps éditorial", "المحتوى"),
      type: "textarea",
    },
    {
      key: "source",
      label: message("Source / attribution", "Source / attribution", "المصدر"),
      type: "text",
    },
    {
      key: "rights",
      label: message("Rights", "Droits", "الحقوق"),
      type: "select",
      options: [
        "owned",
        "licensed",
        "permission",
        "public_domain",
        "unverified",
      ],
    },
  ],
  asset: [
    {
      key: "nativeAssetId",
      label: message(
        "Native vault file",
        "Fichier du coffre natif",
        "ملف الخزنة الأصلي",
      ),
      type: "reference",
    },
    {
      key: "rights",
      label: message("Rights", "Droits", "الحقوق"),
      type: "select",
      options: [
        "owned",
        "licensed",
        "permission",
        "public_domain",
        "unverified",
      ],
    },
    {
      key: "accessibleText",
      label: message(
        "Accessible transcript / text",
        "Texte accessible / transcription",
        "نص يمكن الوصول إليه",
      ),
      type: "textarea",
    },
    {
      key: "downloadAllowed",
      label: message(
        "Download allowed",
        "Téléchargement permis",
        "التنزيل مسموح",
      ),
      type: "toggle",
    },
    {
      key: "printAllowed",
      label: message("Print allowed", "Impression permise", "الطباعة مسموحة"),
      type: "toggle",
    },
  ],
  offer_link: [
    {
      key: "nativeId",
      label: message(
        "Canonical native offer",
        "Offre native canonique",
        "العرض الأصلي",
      ),
      type: "reference",
    },
    {
      key: "role",
      label: message("Commercial role", "Rôle commercial", "الدور التجاري"),
      type: "select",
      options: ["related", "required", "complementary", "included"],
    },
    {
      key: "action",
      label: message("Native action", "Action native", "الإجراء الأصلي"),
      type: "select",
      options: ["details", "purchase", "booking", "enrolment", "enquiry"],
    },
    {
      key: "entitlementSource",
      label: message(
        "Entitlement authority",
        "Autorité des droits",
        "مرجع الأهلية",
      ),
      type: "select",
      options: ["native"],
    },
  ],
  access_policy: [
    {
      key: "scope",
      label: message("Policy scope", "Périmètre de politique", "نطاق السياسة"),
      type: "select",
      options: ["direct", "world", "family", "topic", "template", "experience"],
    },
    {
      key: "targetId",
      label: message("Policy target", "Cible de politique", "هدف السياسة"),
      type: "text",
    },
    {
      key: "print",
      label: message("Print policy", "Politique d’impression", "سياسة الطباعة"),
      type: "select",
      options: ["permitted", "disabled"],
    },
    {
      key: "use",
      label: message(
        "Use policy",
        "Politique d’utilisation",
        "سياسة الاستخدام",
      ),
      type: "select",
      options: ["free"],
    },
    {
      key: "download",
      label: message("Download policy", "Téléchargement", "سياسة التنزيل"),
      type: "select",
      options: ["permitted", "disabled"],
    },
    {
      key: "contribute",
      label: message("Contribution policy", "Contribuer", "سياسة المساهمة"),
      type: "select",
      options: ["account", "moderated", "disabled"],
    },
    {
      key: "expiresAt",
      label: message(
        "Expiry · ISO timestamp",
        "Expiration · ISO",
        "الانتهاء · ISO",
      ),
      type: "text",
    },
    {
      key: "nativeId",
      label: message(
        "Recognized native entitlement offer",
        "Offre native pour les droits",
        "عرض الأهلية الأصلي",
      ),
      type: "reference",
    },
  ],
  ad_connection: [
    {
      key: "publisherId",
      label: message(
        "Publisher ID · ca-pub-…",
        "ID éditeur · ca-pub-…",
        "معرّف الناشر",
      ),
      type: "text",
    },
    {
      key: "account",
      label: message(
        "Google account resource",
        "Ressource du compte Google",
        "مرجع حساب Google",
      ),
      type: "text",
    },
    {
      key: "site",
      label: message("Approved site domain", "Domaine du site", "نطاق الموقع"),
      type: "text",
    },
    {
      key: "verification",
      label: message("Provider status", "Statut fournisseur", "حالة المزوّد"),
      type: "select",
      options: ["not_verified", "pending", "verified", "rejected"],
    },
  ],
  ad_unit: [
    {
      key: "providerName",
      label: message(
        "Google resource name",
        "Nom de ressource Google",
        "مرجع Google",
      ),
      type: "text",
    },
    {
      key: "unitId",
      label: message(
        "Numeric ad unit ID",
        "ID numérique de l’unité",
        "معرّف الوحدة الرقمي",
      ),
      type: "text",
    },
    {
      key: "formatId",
      label: message(
        "Atlas classification",
        "Classification Atlas",
        "تصنيف الأطلس",
      ),
      type: "select",
      options: AD_FORMATS.map((f) => f.id),
    },
    {
      key: "providerState",
      label: message(
        "Last observed state",
        "Dernier état observé",
        "آخر حالة مرصودة",
      ),
      type: "select",
      options: ["unknown", "ACTIVE", "ARCHIVED"],
    },
    {
      key: "localEnabled",
      label: message(
        "Local serving enabled",
        "Diffusion locale autorisée",
        "السماح بالعرض المحلي",
      ),
      type: "toggle",
    },
  ],
  ad_policy: [
    {
      key: "enabled",
      label: message(
        "Allow this placement",
        "Autoriser ce placement",
        "السماح بهذا الموضع",
      ),
      type: "toggle",
    },
    {
      key: "scope",
      label: message("Rule scope", "Périmètre", "نطاق القاعدة"),
      type: "select",
      options: [
        "world",
        "family",
        "topic",
        "template",
        "experience",
        "edition",
        "release",
        "journey",
        "zone",
      ],
    },
    {
      key: "targetId",
      label: message("Target key / ID", "Clé / ID cible", "معرّف الهدف"),
      type: "text",
    },
    {
      key: "formatId",
      label: message(
        "Atlas classification",
        "Classification Atlas",
        "تصنيف الأطلس",
      ),
      type: "select",
      options: AD_FORMATS.map((f) => f.id),
    },
    {
      key: "zone",
      label: message("Placement zone", "Zone de placement", "موضع الإعلان"),
      type: "select",
      options: [...new Set(AD_FORMATS.flatMap((f) => [...f.zones]))],
    },
    {
      key: "unitId",
      label: message(
        "Google unit ID",
        "ID de l’unité Google",
        "معرّف وحدة Google",
      ),
      type: "text",
    },
    {
      key: "consentRequired",
      label: message(
        "Consent required",
        "Consentement requis",
        "الموافقة مطلوبة",
      ),
      type: "toggle",
    },
    {
      key: "childTreatment",
      label: message(
        "Child-directed treatment",
        "Traitement destiné aux enfants",
        "معاملة المحتوى الموجّه للأطفال",
      ),
      type: "toggle",
    },
    {
      key: "minimumSpacing",
      label: message(
        "Minimum spacing · pixels",
        "Espacement minimal · pixels",
        "المسافة الدنيا · بكسل",
      ),
      type: "number",
      min: 200,
      max: 5000,
    },
    {
      key: "maximumCount",
      label: message(
        "Maximum placements",
        "Nombre maximal",
        "الحد الأقصى للمواضع",
      ),
      type: "number",
      min: 0,
      max: 10,
    },
    {
      key: "frequencyMinutes",
      label: message(
        "Frequency · minutes",
        "Fréquence · minutes",
        "التكرار · دقائق",
      ),
      type: "number",
      min: 1,
      max: 1440,
    },
    {
      key: "priority",
      label: message(
        "Priority in this scope",
        "Priorité dans le périmètre",
        "الأولوية في النطاق",
      ),
      type: "number",
      min: 0,
      max: 1000,
    },
  ],
  setting: WORLD_FIELDS,
  case: [
    {
      key: "assignedTo",
      label: message(
        "Assigned native staff",
        "Opérateur natif assigné",
        "الموظف الأصلي المكلّف",
      ),
      type: "reference",
      reference: "staff",
    },
    {
      key: "priority",
      label: message("Priority", "Priorité", "الأولوية"),
      type: "select",
      options: ["low", "normal", "high", "urgent"],
    },
    {
      key: "resolution",
      label: message(
        "Resolution / next step",
        "Résolution / prochaine étape",
        "الحل / الخطوة القادمة",
      ),
      type: "textarea",
    },
  ],
  contribution: [
    {
      key: "moderationReason",
      label: message("Decision reason", "Motif de décision", "سبب القرار"),
      type: "textarea",
    },
  ],
};
