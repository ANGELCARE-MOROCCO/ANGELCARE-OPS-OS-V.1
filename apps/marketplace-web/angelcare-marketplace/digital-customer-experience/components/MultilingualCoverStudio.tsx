"use client";
import { useUI, useQuery } from "./ui";
import { effectiveCoverAssetId, localizedCoverAssetId } from "../cover-contract";
import { text, tr, type Data, type Locale, type Tri } from "../types";
import s from "./multilingual-cover-studio.module.css";

type Media = { id?: string; title?: string; url?: string; mime?: string; status?: string; metadata?: { width?: number; height?: number } };
type Props = {
  data: Data;
  readOnly: boolean;
  busy: boolean;
  onShared: (assetId: string | null) => void;
  onLocalized: (locale: Locale, assetId: string | null) => void;
  chooseImage: (selected: (assetId: string) => void) => void;
};
const LANGUAGES: { locale: Locale; label: string; nativeName: string }[] = [
  { locale: "en", label: "English", nativeName: "English" },
  { locale: "fr", label: "Français", nativeName: "Français" },
  { locale: "ar", label: "العربية", nativeName: "العربية" },
];
function MediaArtwork({ id }: { id: string }) {
  const q = useQuery<Media>({ op: "reference", type: "media", id }, {});
  const asset = q.value;
  const image = id && asset.id === id && typeof asset.url === "string" &&
    asset.mime?.startsWith("image/") && asset.status === "active";
  return (
    <>
      <div className={s.art}>
        {image ? <img src={asset.url} alt={asset.title || "Native media cover"} loading="lazy" /> :
          <div className={s.placeholder} aria-label="Image not yet resolved"><span aria-hidden="true">▧</span><small>{id ? "Awaiting native preview" : "No image selected"}</small></div>}
      </div>
      {id ? <div className={s.assetMeta}>
        <span title={asset.title || id}>{asset.title || id}</span>
        <small>{asset.mime || "Native vault reference"}{asset.metadata?.width && asset.metadata?.height ? " · " + asset.metadata.width + " × " + asset.metadata.height : ""}</small>
        {q.error ? <small className={s.issue} role="status">{String(q.error)}</small> : null}
      </div> : null}
    </>
  );
}
export function MultilingualCoverStudio({ data, readOnly, busy, onShared, onLocalized, chooseImage }: Props) {
  const { locale: uiLocale } = useUI();
  const editable = !readOnly && !busy;
  const label = (translation: Tri) => tr(translation, uiLocale);
  const shared = text(data.coverAssetId);
  return (
    <section className={s.root} aria-labelledby="kidflix-cover-title" data-dce-path="coverAssetId">
      <header className={s.heading}>
        <div>
          <span className={s.kicker}>KIDFLIX · MEDIA VAULT</span>
          <h3 id="kidflix-cover-title">{label(["Multilingual experience covers", "Couvertures multilingues", "أغلفة التجربة متعددة اللغات"])}</h3>
          <p>{label(["One square cover per edition; shared artwork remains an optional fallback.", "Un visuel carré par édition ; une couverture commune reste un recours facultatif.", "غلاف مربع لكل إصدار مع غلاف مشترك احتياطي اختياري."])}</p>
        </div>
        <span className={s.tag}>1:1 · EN / FR / AR</span>
      </header>

      <div className={s.defaultCard}>
        <div className={s.defaultPreview}><MediaArtwork id={shared} /></div>
        <div className={s.defaultDetails}>
          <div className={s.titleLine}>
            <strong>{label(["Shared default cover", "Couverture commune", "الغلاف المشترك"])}</strong>
            <span className={s.fallbackLabel}>{label(["Fallback", "Par défaut", "احتياطي"])}</span>
          </div>
          <p>{label(["Used only when the language has no dedicated cover. Existing single-cover experiences remain unchanged.", "Utilisée uniquement lorsqu'une langue n'a pas de couverture dédiée. Les expériences existantes restent intactes.", "يستخدم عندما لا توجد صورة خاصة باللغة. تبقى التجارب الحالية دون تغيير."])}</p>
          <div className={s.buttons}>
            <button type="button" disabled={!editable} onClick={() => chooseImage((id) => onShared(id))}>
              {shared ? label(["Replace shared", "Remplacer", "استبدال"]) : label(["Choose shared", "Choisir la couverture", "اختيار الغلاف"])}
            </button>
            <button type="button" className={s.secondary} disabled={!editable || !shared} onClick={() => onShared(null)}>
              {label(["Remove shared", "Retirer le partage", "إزالة المشترك"])}
            </button>
          </div>
        </div>
      </div>

      <div className={s.sectionHeading}>
        <strong>{label(["Language-specific artwork", "Couvertures par langue", "أغلفة حسب اللغة"])}</strong>
        <span>{LANGUAGES.filter(({locale}) => !!localizedCoverAssetId(data, locale)).length} / 3 {label(["customised", "personnalisées", "مخصصة"])}</span>
      </div>
      <div className={s.languageGrid}>
        {LANGUAGES.map(({locale, label: language, nativeName}) => {
          const own = localizedCoverAssetId(data, locale);
          const effective = effectiveCoverAssetId(data, locale);
          const sourceStatus = own ? "dedicated" : shared ? "fallback" : "missing";
          const statusLabels: Record<string, Tri> = {
            dedicated: ["Dedicated", "Dédiée", "خاص"],
            fallback: ["Shared fallback", "Couverture commune", "الغلاف المشترك"],
            missing: ["No cover", "Sans couverture", "بلا غلاف"],
          };
          return <article className={s.languageCard} key={locale} data-dce-path={"locales." + locale + ".coverAssetId"} data-cover-state={sourceStatus}>
            <div className={s.languageHead}><div><b>{locale.toUpperCase()}</b><strong lang={locale} dir={locale === "ar" ? "rtl" : "auto"}>{nativeName || language}</strong></div>
              <span data-status={sourceStatus}>{label(statusLabels[sourceStatus])}</span>
            </div>
            <MediaArtwork id={effective} />
            <div className={s.buttons}>
              <button type="button" disabled={!editable} onClick={() => chooseImage((id) => onLocalized(locale, id))}>
                {own ? label(["Replace", "Remplacer", "استبدال"]) : label(["Choose cover", "Choisir un visuel", "اختيار غلاف"])}
              </button>
              <button type="button" className={s.secondary} disabled={!editable || !own} onClick={() => onLocalized(locale, null)}>
                {label(["Use shared", "Utiliser le commun", "استخدام المشترك"])}
              </button>
            </div>
            <small className={s.cardNote}>{own ? label(["Only this edition changes on its next publication.", "Seule cette édition change à sa prochaine publication.", "يتغير هذا الإصدار فقط عند نشره."]) :
              shared ? label(["Currently inherits the shared cover.", "Hérite de la couverture commune.", "يستخدم الغلاف المشترك حالياً."]) :
              label(["Select an image before publishing this edition.", "Choisissez une image avant de publier cette édition.", "اختر صورة قبل نشر هذا الإصدار."])}</small>
          </article>;
        })}
      </div>
      <div className={s.note}>{label(["Existing edition releases remain immutable: saving artwork changes the draft only. Publish the intended language after validation.", "Les éditions publiées restent immuables : enregistrer modifie seulement le brouillon. Publiez ensuite la langue voulue.", "الإصدارات المنشورة ثابتة؛ الحفظ يغير المسودة فقط. انشر اللغة المطلوبة بعد التحقق."])}</div>
    </section>
  );
}
