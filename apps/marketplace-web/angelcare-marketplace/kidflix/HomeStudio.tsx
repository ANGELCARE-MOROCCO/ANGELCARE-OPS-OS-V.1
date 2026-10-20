"use client";
import { GalleryEditor } from "./GalleryEditor";
import { useEffect, useRef, useState } from "react";
import {
  defaultHome,
  normalizeEdition,
  SECTIONS,
  WORLDS,
  locales,
  tr,
  type Locale,
  type HomeEdition,
  emptyCatalogue,
  type Catalogue,
} from "./catalogue";
import { NativeImagePicker, FeaturedResourcePicker } from "./StudioPickers";
import { KidFlixHome } from "./Home";
import { KidFlixShell } from "./Shell";
import {
  useUI,
  useQuery,
  query,
  mutate,
  Panel,
  Button,
  Field,
  Badge,
  State,
  T,
  Dialog,
} from "../digital-customer-experience/components/ui";
import s from "../digital-customer-experience/components/workspace.module.css";
import { KidFlixDefaults } from "./journey/Operator";
export function KidFlixHomeStudio() {
  const { locale, boot, notify } = useUI(),
    q = useQuery<any>({ op: "kidflix_home" }, null),
    [language, setLanguage] = useState<Locale>("en"),
    [edition, setEdition] = useState<HomeEdition>(defaultHome("en").edition),
    [host, setHost] = useState("my.angelcarehub.com"),
    [record, setRecord] = useState<any>(null),
    [draftHash, setHash] = useState(""),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [previewCatalogue,setPreviewCatalogue]=useState<Catalogue>(emptyCatalogue),
    [previewError,setPreviewError]=useState(""),
    [previewBusy,setPreviewBusy]=useState(false),
    receipt = useRef<{ key: string; id: string } | null>(null),
    loaded = useRef("");
  useEffect(() => {
    if (
      !q.value ||
      dirty ||
      (q.value.record?.revision || 0) < (record?.revision || 0)
    )
      return;
    const signature = language + ":" + (q.value.record?.revision || 0);
    if (loaded.current === signature) return;
    loaded.current = signature;
    const r = q.value.record;
    setRecord(r);
    setEdition(
      normalizeEdition(r?.data?.draft?.[language]?.edition || defaultHome(language).edition, language),
    );
    setHost(r?.data?.draftHost || r?.data?.liveHost || "my.angelcarehub.com");
    setHash(q.value.draftHashes?.[language] || "");
  }, [q.value, language, dirty, record?.revision]);
  const edit = (key: keyof HomeEdition, value: any) => {
    setEdition((v) => ({
      ...v,
      [key]: value,
      ...(key === "hero" || key === "heroMobile"
        ? {
            mediaBindings: Object.fromEntries(
              Object.entries(v.mediaBindings || {}).filter(
                ([slot]) => slot !== key,
              ),
            ),
          }
        : key === "familyImages"
          ? {
              mediaBindings: Object.fromEntries(
                Object.entries(v.mediaBindings || {}).filter(
                  ([slot]) => !slot.startsWith("family:"),
                ),
              ),
            }
          : {}),
    }));
    setDirty(true);
  };
  function selectImage(slot: string, asset: { id: string; url: string }) {
    setEdition((v) => ({
      ...v,
      ...(slot === "hero" || slot === "heroMobile"
        ? { [slot]: asset.url }
        : { familyImages: { ...v.familyImages, [slot.slice(7)]: asset.url } }),
      mediaBindings: { ...v.mediaBindings, [slot]: asset.id },
    }));
    setDirty(true);
  }
  async function command(action: string) {
    setBusy(true);
    const payload = {
        action,
        locale: language,
        revision: record?.revision || 0,
        ...(action === "kidflix_save" ? { edition, host } : { draftHash }),
      },
      key = JSON.stringify(payload);
    if (receipt.current?.key !== key)
      receipt.current = { key, id: crypto.randomUUID() };
    try {
      if (action === "kidflix_save") normalizeEdition(edition, language);
      const r = await mutate({ ...payload, requestId: receipt.current.id });
      setRecord(r.record);
      setHash(r.draftHash || draftHash);
      setDirty(false);
      receipt.current = null;
      loaded.current = language + ":" + r.record.revision;
      q.reload();
      notify(
        tr(
          action === "kidflix_save"
            ? [
                "Draft saved. The public edition is unchanged.",
                "Brouillon enregistré. L’édition publique reste inchangée.",
                "حُفظت المسودة. لم تتغير النسخة العامة.",
              ]
            : action === "kidflix_publish"
              ? [
                  "This reviewed language edition is published.",
                  "Cette édition linguistique revue est publiée.",
                  "نُشرت هذه النسخة اللغوية المراجعة.",
                ]
              : [
                  "This language homepage is unpublished.",
                  "Cet accueil linguistique est dépublié.",
                  "أُلغي نشر الصفحة الرئيسية بهذه اللغة.",
                ],
          locale,
        ),
      );
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  function changeLanguage(next: Locale) {
    if (
      dirty &&
      !window.confirm(
        tr(
          [
            "Keep your entries? Cancel to save them before switching language.",
            "Conserver vos saisies ? Annulez pour les enregistrer avant de changer de langue.",
            "هل تريد الاحتفاظ بإدخالاتك؟ ألغِ للتخزين قبل تغيير اللغة.",
          ],
          locale,
        ),
      )
    )
      return;
    setDirty(false);
    setLanguage(next);
    loaded.current = "";
  }
  async function showPreview(){setPreview(true);setPreviewBusy(true);setPreviewError("");try{setPreviewCatalogue(await query<Catalogue>({op:"kidflix_home_preview",locale:language}));}catch(e){setPreviewError((e as Error).message);}finally{setPreviewBusy(false);}}
  const live = record?.data?.live?.[language];
  return (
    <Panel
      title={
        <T
          v={[
            "KidFlix · homepage design & publication",
            "KidFlix · création et publication de l’accueil",
            "كيدفليكس · تصميم الصفحة الرئيسية ونشرها",
          ]}
        />
      }
      actions={
        <Button icon="Eye" onClick={()=>void showPreview()}>
          <T
            v={[
              "Review draft composition",
              "Revoir la composition brouillon",
              "راجع تكوين المسودة",
            ]}
          />
        </Button>
      }
    >
      <p className={s.subtitle}>
        <T
          v={[
            "The same public components, native experience families and current-language releases. Save a draft, review it, then explicitly publish that language.",
            "Les mêmes composants publics, familles natives et éditions publiées par langue. Enregistrez, révisez puis publiez explicitement la langue.",
            "نفس المكونات العامة والعائلات الأصلية والإصدارات حسب اللغة. احفظ المسودة وراجعها ثم انشر لغتها صراحة.",
          ]}
        />
      </p>
      <KidFlixDefaults
        value={edition.familyTools || {}}
        onChange={(v) => edit("familyTools", v)}
        readOnly={busy || !boot.actor.rights.manage}
      />
      <State {...q} retry={q.reload}>
        <div className={s.toolbar}>
          <label>
            <T v={["Edition", "Édition", "النسخة"]} />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Locale)}
            >
              {locales.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <Badge tone={live ? "green" : "orange"}>
            {tr(
              live
                ? [
                    "Published edition exists",
                    "Édition publiée existante",
                    "توجد نسخة منشورة",
                  ]
                : ["Not published", "Non publié", "غير منشور"],
              locale,
            )}
          </Badge>
          <Badge>
            {record
              ? `r${record.revision}`
              : tr(
                  [
                    "New configuration",
                    "Nouvelle configuration",
                    "تهيئة جديدة",
                  ],
                  locale,
                )}
          </Badge>
          {dirty ? (
            <Badge tone="orange">
              <T
                v={[
                  "Unsaved changes",
                  "Modifications non enregistrées",
                  "تغييرات غير محفوظة",
                ]}
              />
            </Badge>
          ) : null}
        </div>
        <div className={s.formGrid}>
          <Field
            label={
              <T
                v={["Public hostname", "Nom d’hôte public", "اسم المضيف العام"]}
              />
            }
          >
            <input
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
                setDirty(true);
              }}
              placeholder="my.angelcarehub.com"
            />
          </Field>
          <Field
            label={
              <T
                v={[
                  "Small opening line",
                  "Petite accroche",
                  "عبارة افتتاحية قصيرة",
                ]}
              />
            }
          >
            <input
              maxLength={100}
              value={edition.eyebrow}
              onChange={(e) => edit("eyebrow", e.target.value)}
            />
          </Field>
          <Field
            label={<T v={["Headline", "Titre principal", "العنوان الرئيسي"]} />}
          >
            <textarea
              maxLength={160}
              value={edition.headline}
              onChange={(e) => edit("headline", e.target.value)}
            />
          </Field>
          <Field label={<T v={["Description", "Description", "الوصف"]} />}>
            <textarea
              maxLength={500}
              value={edition.description}
              onChange={(e) => edit("description", e.target.value)}
            />
          </Field>
          <Field
            label={
              <T
                v={[
                  "Featured resource keys · one per line",
                  "Clés des ressources à la une · une par ligne",
                  "مفاتيح الموارد المميزة · واحد في كل سطر",
                ]}
              />
            }
          >
            <FeaturedResourcePicker
              language={language}
              selected={edition.featured}
              onChange={(v) => edit("featured", v)}
            />
            <GalleryEditor world="home" scenes={edition.gallery} bindings={edition.mediaBindings} disabled={busy || !boot.actor.rights.manage} onChange={(gallery,mediaBindings)=>{setEdition(v=>({...v,gallery,mediaBindings,hero:gallery[0].desktop,heroMobile:gallery[0].mobile,heroAlt:gallery[0].descriptions[language]}));setDirty(true);}} />
        <details className={s.advanced}>
              <summary>
                <T
                  v={[
                    "Advanced · exact native keys",
                    "Avancé · clés natives exactes",
                    "متقدم · المفاتيح الأصلية الدقيقة",
                  ]}
                />
              </summary>
              <textarea
                aria-label="Native featured keys"
                value={edition.featured.join("\n")}
                onChange={(e) =>
                  edit(
                    "featured",
                    e.target.value.split(/\r?\n/).filter(Boolean),
                  )
                }
              />
            </details>
          </Field>
          <Field
            label={
              <T
                v={[
                  "Optional start · UTC",
                  "Début optionnel · UTC",
                  "بداية اختيارية · UTC",
                ]}
              />
            }
          >
            <input
              type="datetime-local"
              value={edition.startsAt ? edition.startsAt.slice(0, 16) : ""}
              onChange={(e) =>
                edit("startsAt", e.target.value ? e.target.value + ":00Z" : "")
              }
            />
          </Field>
          <Field
            label={
              <T
                v={[
                  "Optional end · UTC",
                  "Fin optionnelle · UTC",
                  "نهاية اختيارية · UTC",
                ]}
              />
            }
          >
            <input
              type="datetime-local"
              value={edition.endsAt ? edition.endsAt.slice(0, 16) : ""}
              onChange={(e) =>
                edit("endsAt", e.target.value ? e.target.value + ":00Z" : "")
              }
            />
          </Field>
        </div>
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Homepage sections & order",
                "Sections et ordre de l’accueil",
                "أقسام الصفحة الرئيسية وترتيبها",
              ]}
            />
          </summary>
          <p className={s.subtitle}>
            <T
              v={[
                "Inventory sections disappear when no resources are published. Gateways remain useful.",
                "Les sections de catalogue disparaissent sans ressource publiée. Les passerelles restent utiles.",
                "تختفي أقسام المحتوى عند عدم وجود موارد منشورة وتبقى بوابات الاكتشاف مفيدة.",
              ]}
            />
          </p>
          {[
            ...edition.sections,
            ...SECTIONS.filter((k) => !edition.sections.includes(k)),
          ].map((key, i) => (
            <div className={s.rowCard} key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={edition.sections.includes(key)}
                  onChange={(e) =>
                    edit(
                      "sections",
                      e.target.checked
                        ? [...edition.sections, key]
                        : edition.sections.filter((v) => v !== key),
                    )
                  }
                />{" "}
                {key}
              </label>
              <div className={s.actions}>
                <Button
                  disabled={!edition.sections.includes(key) || i === 0}
                  children={null}
                  ariaLabel={tr(["Move up", "Monter", "نقل لأعلى"], locale)}
                  icon="ArrowUp"
                  onClick={() => {
                    const order = [...edition.sections];
                    [order[i - 1], order[i]] = [order[i], order[i - 1]];
                    edit("sections", order);
                  }}
                />
                <Button
                  disabled={
                    !edition.sections.includes(key) ||
                    i >= edition.sections.length - 1
                  }
                  children={null}
                  ariaLabel={tr(
                    ["Move down", "Descendre", "نقل لأسفل"],
                    locale,
                  )}
                  icon="ArrowDown"
                  onClick={() => {
                    const order = [...edition.sections];
                    [order[i + 1], order[i]] = [order[i], order[i + 1]];
                    edit("sections", order);
                  }}
                />
              </div>
            </div>
          ))}
        </details>
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Sixteen native worlds · artwork & order",
                "Seize univers natifs · images et ordre",
                "العوالم الستة عشر · الصور والترتيب",
              ]}
            />
          </summary>
          {edition.familyOrder.map((key, i) => {
            const w = WORLDS.find((w) => w.key === key)!;
            return (
              <div className={s.rowCard} key={key}>
                <strong>{tr(w.title, locale)}</strong>
                <NativeImagePicker
                  onSelect={(a) => selectImage("family:" + key, a)}
                />
                <div className={s.actions}>
                  <Button
                    disabled={i === 0}
                    onClick={() => {
                      const order = [...edition.familyOrder];
                      [order[i - 1], order[i]] = [order[i], order[i - 1]];
                      edit("familyOrder", order);
                    }}
                    children={null}
                    ariaLabel={tr(["Move up", "Monter", "نقل لأعلى"], locale)}
                    icon="ArrowUp"
                    title={tr(["Move up", "Monter", "نقل لأعلى"], locale)}
                  />
                  <Button
                    disabled={i === 15}
                    onClick={() => {
                      const order = [...edition.familyOrder];
                      [order[i + 1], order[i]] = [order[i], order[i + 1]];
                      edit("familyOrder", order);
                    }}
                    children={null}
                    ariaLabel={tr(
                      ["Move down", "Descendre", "نقل لأسفل"],
                      locale,
                    )}
                    icon="ArrowDown"
                    title={tr(["Move down", "Descendre", "نقل لأسفل"], locale)}
                  />
                </div>
                <label>
                  {tr(
                    [
                      "Optional artwork URL",
                      "URL d’image optionnelle",
                      "رابط صورة اختياري",
                    ],
                    locale,
                  )}
                  <input
                    value={edition.familyImages[key] || ""}
                    placeholder={w.image}
                    onChange={(e) =>
                      edit("familyImages", {
                        ...edition.familyImages,
                        [key]: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            );
          })}
        </details>
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Governed advertising positions",
                "Emplacements publicitaires gouvernés",
                "مواضع الإعلانات المحكومة",
              ]}
            />
          </summary>
          <p>
            <T
              v={[
                "Positions are prepared between discovery sections. This chapter does not inject Google scripts or request advertising. Native provider, age-treatment, consent and placement acceptance remain separate before activation.",
                "Les emplacements sont préparés entre les sections. Ce chapitre n’injecte aucun script Google et ne demande aucune annonce. La validation fournisseur, âge, consentement et emplacements précède l’activation.",
                "المواضع معدّة بين أقسام الاكتشاف. لا يحقن هذا الفصل نصوص Google ولا يطلب إعلانات. يلزم تحقق المزود ومعالجة العمر والموافقة والمواضع قبل التفعيل.",
              ]}
            />
          </p>
          {["after-worlds", "after-printables", "after-bundles"].map((slot) => (
            <label key={slot} className={s.rowCard}>
              <input
                type="checkbox"
                checked={edition.adSlots.includes(slot)}
                onChange={(e) =>
                  edit(
                    "adSlots",
                    e.target.checked
                      ? [...edition.adSlots, slot]
                      : edition.adSlots.filter((v) => v !== slot),
                  )
                }
              />{" "}
              {slot}
            </label>
          ))}
        </details>
        <div className={s.actions}>
          <Button
            disabled={busy || !boot.actor.rights.manage}
            icon="Save"
            onClick={() => command("kidflix_save")}
          >
            <T v={["Save draft", "Enregistrer le brouillon", "احفظ المسودة"]} />
          </Button>
          <Button
            disabled={
              busy ||
              dirty ||
              !record ||
              !draftHash ||
              !boot.actor.rights.publish
            }
            icon="BadgeCheck"
            onClick={() => {
              if (
                window.confirm(
                  tr(
                    [
                      "Publish this reviewed language edition?",
                      "Publier cette édition linguistique revue ?",
                      "هل تريد نشر هذه النسخة اللغوية المراجعة؟",
                    ],
                    locale,
                  ),
                )
              )
                command("kidflix_publish");
            }}
          >
            <T
              v={[
                "Publish this language",
                "Publier cette langue",
                "انشر هذه اللغة",
              ]}
            />
          </Button>
          <Button
            disabled={busy || !live || !boot.actor.rights.publish}
            onClick={() => {
              if (
                window.confirm(
                  tr(
                    [
                      "Unpublish this language homepage?",
                      "Dépublier cet accueil linguistique ?",
                      "هل تريد إلغاء نشر الصفحة الرئيسية بهذه اللغة؟",
                    ],
                    locale,
                  ),
                )
              )
                command("kidflix_unpublish");
            }}
          >
            <T
              v={[
                "Unpublish this language",
                "Dépublier cette langue",
                "ألغِ نشر هذه اللغة",
              ]}
            />
          </Button>
          <a
            className={s.button}
            href={"/kidflix/" + language}
            target="_blank"
            rel="noopener noreferrer"
          >
            <T
              v={[
                "Open public world",
                "Ouvrir le monde public",
                "افتح العالم العام",
              ]}
            />
          </a>
        </div>
      </State>
      {preview ? (
        <Dialog
          wide
          title={
            <T
              v={[
                "KidFlix · staff composition preview · no advertising",
                "KidFlix · aperçu interne de composition · sans publicité",
                "كيدفليكس · معاينة تكوين داخلية · دون إعلانات",
              ]}
            />
          }
          onClose={() => setPreview(false)}
        >
          <p className={s.subtitle}>
            <T
              v={[
                "This preview uses the current draft and the existing published catalogue.",
                "Cet aperçu utilise le brouillon et le catalogue publié existant.",
                "تستخدم هذه المعاينة المسودة والكتالوج المنشور الحالي.",
              ]}
            />
          </p>
          {previewError?<div role="alert">{previewError}<Button onClick={()=>void showPreview()}><T v={["Retry","Réessayer","حاول مجدداً"]}/></Button></div>:null}
          {previewBusy?<p role="status">KidFlix…</p>:null}
          <KidFlixShell locale={language}>
            <KidFlixHome
              locale={language}
              config={{
                locale: language,
                edition,
                published: false,
                revision: record?.revision || 0,
              }}
              catalogue={previewCatalogue}
            />
          </KidFlixShell>
        </Dialog>
      ) : null}
    </Panel>
  );
}
