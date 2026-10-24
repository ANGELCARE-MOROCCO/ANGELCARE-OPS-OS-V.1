"use client";
import { tr, type Locale } from "../catalogue";
import { NativeImagePicker, FeaturedResourcePicker } from "../StudioPickers";
import {
  Button,
  Field,
  T,
} from "../../digital-customer-experience/components/ui";
import s from "../../digital-customer-experience/components/workspace.module.css";
export function DocumentsStudio({
  locale,
  language,
  value,
  onChange,
  links,
  onLinks,
}: {
  locale: Locale;
  language: Locale;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  links: Record<string, string>;
  onLinks: (v: Record<string, string>) => void;
}) {
  const edit = (i: number, key: string, next: unknown) =>
    onChange(value.map((t, n) => (n === i ? { ...t, [key]: next } : t)));
  return (
    <details className={s.advanced}>
      <summary>
        {tr(
          [
            "Documents · approved feedback and footer channels",
            "Documents · témoignages autorisés et liens sociaux",
            "الوثائق · آراء معتمدة وروابط القنوات",
          ],
          locale,
        )}
      </summary>
      <p className={s.subtitle}>
        {tr(
          [
            "Publish genuine educator feedback only. A source and explicit permission are required. Ratings are calculated only from the published feedback linked to each document; hearts are never converted into ratings. Portraits must come from the native Media Library.",
            "Publiez uniquement de vrais témoignages avec source et autorisation explicite. Les notes sont calculées sur les témoignages publiés liés au document ; les cœurs ne sont jamais convertis en notes. Portraits issus de la médiathèque native.",
            "انشر آراء حقيقية مع مصدر وإذن صريح. تحسب التقييمات من الآراء المنشورة المرتبطة بالوثيقة؛ ولا تحول القلوب إلى تقييمات. الصور من المكتبة الأصلية.",
          ],
          locale,
        )}
      </p>
      {value.map((t, i) => (
        <div className={s.rowCard} key={String(t.id)}>
          <div className={s.twoColumns}>
            {[
              [
                "name",
                [
                  "Public author name",
                  "Nom public de l’auteur",
                  "الاسم العام للكاتب",
                ],
              ],
              ["role", ["Public role", "Fonction publique", "الصفة العامة"]],
              [
                "sourceUrl",
                [
                  "Evidence / original published source URL",
                  "URL de la source originale",
                  "رابط المصدر الأصلي",
                ],
              ],
            ].map(([key, label]) => (
              <Field
                key={String(key)}
                label={tr(label as [string, string, string], locale)}
              >
                <input
                  value={String(t[String(key)] || "")}
                  type={key === "sourceUrl" ? "url" : "text"}
                  maxLength={key === "sourceUrl" ? 2048 : 180}
                  onChange={(e) => edit(i, String(key), e.target.value)}
                />
              </Field>
            ))}
            <Field
              label={tr(
                [
                  "Actual rating in this source",
                  "Note réelle de cette source",
                  "التقييم الحقيقي في المصدر",
                ],
                locale,
              )}
            >
              <select
                value={Number(t.rating) || 5}
                onChange={(e) => edit(i, "rating", Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field
            label={tr(
              [
                "Exact approved quotation",
                "Citation exacte autorisée",
                "الاقتباس المعتمد الدقيق",
              ],
              locale,
            )}
          >
            <textarea
              maxLength={700}
              rows={3}
              value={String(t.body || "")}
              onChange={(e) => edit(i, "body", e.target.value)}
            />
          </Field>
          <Field
            label={tr(
              [
                "Document this feedback concerns (optional)",
                "Document concerné (optionnel)",
                "الوثيقة المعنية (اختياري)",
              ],
              locale,
            )}
          >
            <FeaturedResourcePicker
              family="documents"
              language={language}
              selected={t.resourceKey ? [String(t.resourceKey)] : []}
              onChange={(keys) => edit(i, "resourceKey", keys.at(-1) || "")}
            />
          </Field>
          <NativeImagePicker
            onSelect={(asset) =>
              onChange(
                value.map((t, n) =>
                  n === i
                    ? {
                        ...t,
                        portraitAssetId: asset.id,
                        portraitPreviewUrl: asset.url,
                      }
                    : t,
                ),
              )
            }
          />
          {t.portraitAssetId ? (
            <Button icon="X" onClick={() => edit(i, "portraitAssetId", "")}>
              <T
                v={["Remove portrait", "Retirer le portrait", "إزالة الصورة"]}
              />
            </Button>
          ) : null}
          <label className={s.rowCard}>
            <input
              type="checkbox"
              checked={t.publicationPermission === true}
              onChange={(e) =>
                edit(i, "publicationPermission", e.target.checked)
              }
            />
            {tr(
              [
                "I have verified permission to publish this quotation, attribution and selected portrait.",
                "J’ai vérifié l’autorisation de publier cette citation, son attribution et le portrait choisi.",
                "تحققت من إذن نشر هذا الاقتباس ونسبته والصورة المختارة.",
              ],
              locale,
            )}
          </label>
          <Button
            icon="Trash2"
            onClick={() => onChange(value.filter((_, n) => n !== i))}
          >
            <T
              v={[
                "Remove testimonial",
                "Retirer le témoignage",
                "إزالة الشهادة",
              ]}
            />
          </Button>
        </div>
      ))}
      <Button
        icon="Plus"
        disabled={value.length >= 12}
        onClick={() =>
          onChange([
            ...value,
            {
              id: "feedback-" + crypto.randomUUID(),
              name: "",
              role: "",
              body: "",
              sourceUrl: "",
              resourceKey: "",
              portraitAssetId: "",
              rating: 5,
              publicationPermission: false,
            },
          ])
        }
      >
        <T
          v={[
            "Add a sourced testimonial",
            "Ajouter un témoignage sourcé",
            "إضافة شهادة موثقة",
          ]}
        />
      </Button>
      <h3>
        {tr(
          [
            "Official footer channels",
            "Canaux officiels du pied de page",
            "قنوات التذييل الرسمية",
          ],
          locale,
        )}
      </h3>
      <div className={s.twoColumns}>
        {["youtube", "pinterest", "instagram", "facebook"].map((key) => (
          <Field key={key} label={key}>
            <input
              type="url"
              maxLength={2048}
              placeholder={"https://…"}
              value={links[key] || ""}
              onChange={(e) => onLinks({ ...links, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <p className={s.subtitle}>
        {tr(
          [
            "Only published channel URLs become links. Unconfigured channels remain labelled visual marks, with no invented destination.",
            "Seules les URL publiées deviennent des liens. Les canaux non configurés restent des repères visuels sans destination inventée.",
            "تصبح الروابط المنشورة فقط روابط فعلية. القنوات غير المهيأة علامات مرئية بلا وجهة مختلقة.",
          ],
          locale,
        )}
      </p>
    </details>
  );
}
