import { FAMILIES } from "./registry";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Locale,
} from "./types";
export function explainIssue(
  record: Partial<DceRecord>,
  issue: { path: string; code: string; message: any },
  locale: Locale,
) {
  const f = FAMILIES.find((f) => f.key === record.family),
    path = issue.path
      .replace(/^data\./, "")
      .replace(/^locales\.(ar|en|fr)\./, ""),
    parts = path.split("."),
    collection = f?.collections.find((c) => c.key === parts[0]),
    unit = collection
      ? array(object(record.data)[collection.key]).find(
          (u, i) => String(i) === parts[1] || u.id === parts[1],
        )
      : undefined,
    key = parts.at(-1) || path,
    field =
      collection?.fields.find((f) => f.key === key) ||
      f?.fields.find((f) => f.key === key),
    name =
      (unit
        ? text(unit.title) ||
          text(unit.prompt) ||
          text(unit.front) ||
          text(unit.id)
        : "") + (field ? " · " + tr(field.label, locale) : ""),
    prefix = tr(
      [
        "Complete or correct this field in the selected language.",
        "Complétez ou corrigez ce champ dans la langue sélectionnée.",
        "أكمل أو صحح هذا الحقل باللغة المختارة.",
      ],
      locale,
    );
  return {
    label:
      name ||
      tr(
        (
          {
            outputs: [
              "Download outputs",
              "Fichiers téléchargeables",
              "ملفات التنزيل",
            ],
            title: ["Title", "Titre", "العنوان"],
            summary: ["Summary", "Résumé", "الملخص"],
            visibility: [
              "Free public access",
              "Accès public gratuit",
              "الوصول العام المجاني",
            ],
            certificatePolicy: [
              "Optional course certificate",
              "Certificat de cours facultatif",
              "شهادة دورة اختيارية",
            ],
          } as Record<string, any>
        )[parts[0]] || [path, path, path],
        locale,
      ),
    message:
      issue.code.includes("TRANSLATION") || issue.code === "REQUIRED"
        ? prefix
        : tr(issue.message, locale),
    tab:
      parts[0] === "outputs" || parts[0] === "certificatePolicy"
        ? "delivery"
        : "content",
    path,
  };
}
export function modeExplanation(engine: string, locale: Locale) {
  return tr(
    [
      "Configured engine: " +
        engine +
        ". The preview demonstrates its supported controls. Mode names do not enable arbitrary games, scripts, visitor intake or provider-owned ad formats.",
      "Moteur configuré : " +
        engine +
        ". L’aperçu démontre ses contrôles pris en charge. Un nom de mode n’active ni jeux arbitraires, ni scripts, ni réception visiteur, ni format publicitaire réservé au fournisseur.",
      "المحرّك المهيأ: " +
        engine +
        ". توضح المعاينة الأدوات المدعومة. لا تفعّل أسماء الأوضاع ألعاباً عشوائية أو شيفرات أو استقبال طلبات الزوار أو صيغ إعلانات خاصة بالمزوّد.",
    ],
    locale,
  );
}
