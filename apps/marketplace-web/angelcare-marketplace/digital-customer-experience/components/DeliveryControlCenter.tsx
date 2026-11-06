"use client";
import { useState, useEffect, type ReactNode } from "react";
import { isHtmlDelivery, packageForLocale } from "../delivery-contract";
import { applyDeliveryRepair, deliveryRepairPlan } from "../delivery-repair";
import { SUBTYPES } from "../reference-model";
import {
  object,
  text,
  tr,
  type DceRecord,
  type Family,
  type Locale,
} from "../types";
import { useUI } from "./ui";
import s from "./delivery.module.css";
import { DeliveryDraftRepair } from "./DeliveryDraftRepair";
import { DossierConnections } from "./DossierConnections";
export function DeliveryControlCenter({
  record,
  family,
  language,
  onChange,
  onAdvanced,
  templateControl,
}: {
  record: Partial<DceRecord>;
  family: Family;
  language: Locale;
  onChange: (record: Partial<DceRecord>) => void;
  onAdvanced: () => void;
  templateControl?: ReactNode;
}) {
  const { locale, boot } = useUI(),
    [tab, setTab] = useState("identity"),
    [review, setReview] = useState(false);
  const t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale),
    data = object(record.data),
    html = isHtmlDelivery(data),
    repairs = deliveryRepairPlan(record, family);
  useEffect(() => setReview(false), [record.id, record.key]);
  const patch = (values: Record<string, any>) =>
    onChange({ ...record, data: { ...data, ...values } });
  return (
    <section
      className={s.center}
      aria-label={t(
        "Publication control center",
        "Centre de publication",
        "مركز النشر",
      )}
    >
      <header className={s.heading}>
        <div>
          <small>KIDFLIX · CONTENT 360</small>
          <h2>
            {t(
              "Your collection, fully connected",
              "Votre collection, parfaitement reliée",
              "مجموعتك مترابطة بالكامل",
            )}
          </h2>
          <p>
            {t(
              "One catalogue identity. A controlled experience for each language.",
              "Une identité catalogue. Une expérience maîtrisée pour chaque langue.",
              "هوية كتالوج واحدة وتجربة محددة لكل لغة.",
            )}
          </p>
        </div>
        <span className={s.format}>
          {html ? "HTML" : "NATIF"} · {language.toUpperCase()}
        </span>
      </header>
      <nav
        className={s.tabs}
        aria-label={t(
          "Collection controls",
          "Réglages de la collection",
          "إعدادات المجموعة",
        )}
      >
        {[
          [
            "identity",
            t("Collection & links", "Collection et liens", "المجموعة والروابط"),
          ],
          [
            "delivery",
            t("Delivery & languages", "Format et langues", "الصيغة واللغات"),
          ],
          [
            "repair",
            t("Metadata review", "Révision des données", "مراجعة البيانات"),
          ],
          [
            "connections",
            t("Linked resources", "Ressources liées", "الموارد المرتبطة"),
          ],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
            {key === "repair" && repairs.length > 0 ? (
              <b>{repairs.length}</b>
            ) : null}
          </button>
        ))}
        <button type="button" onClick={onAdvanced}>
          {t("All capabilities", "Toutes les capacités", "جميع الإمكانات")} ↗
        </button>
      </nav>
      {tab === "identity" && (
        <div className={s.grid}>
          <label>
            {t("Atomic category", "Catégorie principale", "الفئة الرئيسية")}
            <input readOnly value={tr(family.name, locale)} />
            <small>
              {family.key} ·{" "}
              {t(
                "Existing identity is preserved",
                "L’identité existante est conservée",
                "الهوية الحالية محفوظة",
              )}
            </small>
          </label>
          <label>
            {t("Subcategory", "Sous-catégorie", "الفئة الفرعية")}
            <select
              aria-label={t("Subcategory", "Sous-catégorie", "الفئة الفرعية")}
              value={text(data.subtype)}
              onChange={(e) => patch({ subtype: e.target.value })}
            >
              <option value="">
                {t("Not specified", "Non précisée", "غير محددة")}
              </option>
              {text(data.subtype) &&
                !SUBTYPES[family.key]?.authored.some(
                  (x) => x.id === data.subtype,
                ) && (
                  <option value={text(data.subtype)}>
                    {text(data.subtype)} ·{" "}
                    {t(
                      "Review existing value",
                      "Valeur existante à vérifier",
                      "قيمة موجودة للمراجعة",
                    )}
                  </option>
                )}
              {SUBTYPES[family.key]?.authored.map((x) => (
                <option key={x.id} value={x.id}>
                  {tr(x.label, locale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(
              "Topic / parent group",
              "Thème / groupe parent",
              "الموضوع أو المجموعة الأم",
            )}
            <select
              aria-label={t(
                "Topic / parent group",
                "Thème / groupe parent",
                "الموضوع أو المجموعة الأم",
              )}
              value={record.topic || ""}
              onChange={(e) =>
                onChange({ ...record, topic: e.target.value || null })
              }
            >
              <option value="">
                {t("No parent topic", "Aucun thème parent", "دون موضوع أصلي")}
              </option>
              {record.topic &&
                !boot.topics.some((x) => x.id === record.topic) && (
                  <option value={record.topic}>{record.topic}</option>
                )}
              {boot.topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title} · {topic.key}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(
              "Stable catalogue key",
              "Clé catalogue stable",
              "مفتاح الكتالوج الثابت",
            )}
            <input
              value={text(record.key)}
              readOnly={!!record.id}
              onChange={(e) => onChange({ ...record, key: e.target.value })}
            />
            <small>
              {t(
                "Used for matching imports and public URLs",
                "Utilisée pour les imports et les URL publiques",
                "تستخدم لمطابقة الاستيراد والعناوين العامة",
              )}
            </small>
          </label>
          <label>
            {t(
              "Subject / catalogue family",
              "Matière / famille catalogue",
              "المادة أو عائلة الكتالوج",
            )}
            <input
              value={text(data.subject)}
              onChange={(e) => patch({ subject: e.target.value })}
            />
          </label>
          <div>{templateControl}</div>
        </div>
      )}
      {tab === "delivery" && (
        <>
          <div className={s.choice}>
            <label>
              <input
                type="radio"
                name={"delivery-" + (record.id || record.key)}
                checked={html}
                onChange={() =>
                  patch({
                    delivery: { ...object(data.delivery), kind: "html" },
                  })
                }
              />
              <strong>
                {t(
                  "Complete HTML experience",
                  "Expérience HTML complète",
                  "تجربة HTML كاملة",
                )}
              </strong>
              <span>
                {t(
                  "The package owns its cards and interactions.",
                  "Le package contient ses cartes et ses interactions.",
                  "تتضمن الحزمة بطاقاتها وتفاعلاتها.",
                )}
              </span>
            </label>
            <label>
              <input
                type="radio"
                name={"delivery-" + (record.id || record.key)}
                checked={!html}
                onChange={() =>
                  patch({
                    delivery: { ...object(data.delivery), kind: "native" },
                  })
                }
              />
              <strong>
                {t(
                  "Native category player",
                  "Lecteur natif de la catégorie",
                  "المشغل الأصلي للفئة",
                )}
              </strong>
              <span>
                {t(
                  "Use the existing structured content and all native tools.",
                  "Utiliser le contenu structuré et tous les outils natifs.",
                  "استخدام المحتوى المنظم وجميع الأدوات الأصلية.",
                )}
              </span>
            </label>
          </div>
          <div className={s.editions}>
            {(["fr", "en", "ar"] as const).map((l) => {
              const ref = packageForLocale(data, l);
              return (
                <article key={l}>
                  <strong>{l.toUpperCase()}</strong>
                  <span>
                    {text(ref.id)
                      ? t("Package linked", "Package associé", "الحزمة مرتبطة")
                      : t(
                          "Awaiting package",
                          "En attente de package",
                          "بانتظار الحزمة",
                        )}
                  </span>
                  {text(ref.id) && (
                    <code title={text(ref.id)}>
                      {text(ref.id).slice(0, 12)}…
                    </code>
                  )}
                </article>
              );
            })}
          </div>
          <p className={s.note}>
            {t(
              "Native content is retained when HTML is selected. It is excluded from this HTML publication’s content requirements. Switch formats to use it again.",
              "Le contenu natif est conservé lorsque HTML est sélectionné. Ses exigences restent inactives pour cette publication HTML. Changez de format pour le réutiliser.",
              "يحفظ المحتوى الأصلي عند اختيار HTML ولا تفرض متطلباته على نشر HTML. بدّل الصيغة لإعادة استخدامه.",
            )}
          </p>
        </>
      )}
      {tab === "connections" &&
        (record.id ? (
          <DossierConnections id={record.id} />
        ) : (
          <p className={s.note}>
            {t(
              "Save the draft to inspect its native connections.",
              "Enregistrez le brouillon pour examiner ses liens natifs.",
              "احفظ المسودة لفحص روابطها الأصلية.",
            )}
          </p>
        ))}
      {tab === "repair" && (
        <div className={s.repairs}>
          {!repairs.length ? (
            <p>
              {t(
                "No known obsolete values were found. Final server inspection remains required.",
                "Aucune valeur obsolète connue détectée. La vérification serveur finale reste requise.",
                "لا توجد قيم قديمة معروفة. يبقى فحص الخادم النهائي مطلوباً.",
              )}
            </p>
          ) : (
            <>
              <p>
                {t(
                  "Review the proposed changes. Original values remain in the dossier’s repair history.",
                  "Vérifiez les changements proposés. Les valeurs d’origine restent dans l’historique du dossier.",
                  "راجع التغييرات المقترحة. تحفظ القيم الأصلية في سجل الملف.",
                )}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>{t("Field", "Champ", "الحقل")}</th>
                    <th>{t("Current", "Actuel", "الحالي")}</th>
                    <th>{t("Proposed", "Proposé", "المقترح")}</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((fix) => (
                    <tr key={fix.path}>
                      <th>{fix.path}</th>
                      <td>{String(fix.before ?? "")}</td>
                      <td>{String(fix.after) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <label className={s.review}>
                <input
                  type="checkbox"
                  checked={review}
                  onChange={(e) => setReview(e.target.checked)}
                />
                {t(
                  "I reviewed the classifications and continuity behavior.",
                  "J’ai vérifié les classements et le comportement de reprise.",
                  "راجعت التصنيفات وسلوك الاستئناف.",
                )}
              </label>
              <button
                type="button"
                className={s.primary}
                disabled={!review}
                onClick={() => {
                  onChange(applyDeliveryRepair(record, repairs));
                  setReview(false);
                }}
              >
                {t(
                  "Apply reviewed repairs",
                  "Appliquer les corrections vérifiées",
                  "تطبيق الإصلاحات المراجعة",
                )}
              </button>
            </>
          )}
          <DeliveryDraftRepair family={family.key} />
        </div>
      )}
    </section>
  );
}
