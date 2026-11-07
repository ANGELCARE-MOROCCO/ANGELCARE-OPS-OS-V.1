"use client";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { familyByKey } from "../registry";
import {
  dossierCapabilityIndex,
  localizedCells,
  translatedPatch,
  SECTION_LABELS,
} from "../production-model";
import { WORKSPACES, workspaceForSection } from "../workspace-contract";
import { isHtmlDelivery, packageForLocale } from "../delivery-contract";
import {
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Locale,
  type Tri,
} from "../types";
import { Button, Badge, T, useUI, mutate } from "./ui";
import s from "./dossier-workspace.module.css";
const RuntimePreview = lazy(() =>
  import("./Preview").then((m) => ({ default: m.RuntimePreview })),
);
export function DossierStudio({
  record,
  language,
  dirty,
  readOnly,
  busy,
  tabs,
  active,
  onNavigate,
  onLocate,
  onSave,
  onChange,
  children,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  dirty: boolean;
  readOnly: boolean;
  busy: boolean;
  tabs: readonly (readonly [string, Tri])[];
  active: string;
  onNavigate: (key: string) => void;
  onLocate: (path: string) => void;
  onSave: () => Promise<DceRecord | undefined>;
  onChange: (patch: Data) => void;
  children: ReactNode;
}) {
  const { locale } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale);
  const [search, setSearch] = useState(""),
    [sourceLanguage, setSourceLanguage] = useState<Locale>("en"),
    [page, setPage] = useState(0),
    [languageSearch, setLanguageSearch] = useState("");
  const group = workspaceForSection(active),
    previous = useRef<Record<string, string>>({});
  const family = familyByKey(record.family || ""),
    catalog = useMemo(
      () => dossierCapabilityIndex(record),
      [record.family, record.kind],
    );
  const cells = useMemo(() => localizedCells(record, family), [record, family]);
  const visible = catalog.filter(
    (c) =>
      !search ||
      [c.path, ...c.label, c.group, c.kind]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const translations = cells.filter(
    (c) =>
      !languageSearch ||
      [c.path, ...c.label, ...Object.values(c.values)]
        .join(" ")
        .toLowerCase()
        .includes(languageSearch.toLowerCase()),
  );
  const currentTabs = tabs.filter(([key]) => group.sections.includes(key));
  const available = WORKSPACES.filter(
    (w) =>
      w.key === "preview" || tabs.some(([key]) => w.sections.includes(key)),
  );
  useEffect(() => {
    previous.current[group.key] = active;
  }, [active, group.key]);
  useEffect(() => {
    if (active !== "preview" && !tabs.some(([key]) => key === active))
      onNavigate(
        tabs.some(([key]) => key === "overview")
          ? "overview"
          : tabs[0]?.[0] || "overview",
      );
  }, [active, tabs.map((t) => t[0]).join("|")]);
  return (
    <div className={s.studio} data-testid="canonical-dossier-workspace">
      <header className={s.identity}>
        <div>
          <span className={s.eyebrow}>KIDFLIX · CONTENT 360</span>
          <h2>
            {record.title ||
              t("New experience", "Nouvelle expérience", "تجربة جديدة")}
          </h2>
          <p>
            {family ? tr(family.name, locale) : record.kind} ·{" "}
            {language.toUpperCase()} · r{record.revision || 0}
          </p>
        </div>
        <div className={s.actions}>
          <Badge tone={dirty ? "orange" : "green"}>
            {dirty
              ? t(
                  "Changes awaiting save",
                  "Modifications à enregistrer",
                  "تغييرات بانتظار الحفظ",
                )
              : t("Saved revision", "Version enregistrée", "نسخة محفوظة")}
          </Badge>
          <Button
            disabled={busy || readOnly || !dirty}
            kind="primary"
            onClick={onSave}
          >
            <T v={["Save changes", "Enregistrer", "حفظ التغييرات"]} />
          </Button>
        </div>
      </header>
      <nav
        className={s.nav}
        aria-label={t(
          "Experience workspace",
          "Espace de l’expérience",
          "مساحة التجربة",
        )}
      >
        {available.map((w) => (
          <button
            type="button"
            key={w.key}
            aria-current={group.key === w.key ? "page" : undefined}
            onClick={() =>
              onNavigate(
                previous.current[w.key] ||
                  tabs.find(([key]) => w.sections.includes(key))?.[0] ||
                  "preview",
              )
            }
          >
            {tr(w.label, locale)}
          </button>
        ))}
      </nav>
      {currentTabs.length > 1 && (
        <nav
          className={s.subnav}
          aria-label={t(
            "Workspace controls",
            "Réglages de cet espace",
            "إعدادات المساحة",
          )}
        >
          {currentTabs.map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={active === key}
              onClick={() => onNavigate(key)}
            >
              {tr(SECTION_LABELS[key] || label, locale)}
            </button>
          ))}
        </nav>
      )}
      <section className={s.body} aria-label={tr(group.label, locale)}>
        {active === "preview" ? (
          <SavedExperiencePreview
            record={record}
            language={language}
            dirty={dirty}
            onSave={onSave}
          />
        ) : (
          children
        )}
      </section>
      <details className={s.tools}>
        <summary>
          {t("Find any control", "Trouver un réglage", "البحث عن أي إعداد")} ·{" "}
          {catalog.length}
        </summary>
        <p>
          {t(
            "All registered fields, collections, tools and actions remain available.",
            "Tous les champs, collections, outils et actions enregistrés restent accessibles.",
            "تبقى جميع الحقول والمجموعات والأدوات والإجراءات المسجلة متاحة.",
          )}
        </p>
        <input
          type="search"
          aria-label={t(
            "Search controls",
            "Rechercher un réglage",
            "البحث في الإعدادات",
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={s.capabilities}>
          {visible.map((entry) => (
            <button
              type="button"
              key={entry.id}
              disabled={entry.status === "legacy"}
              onClick={() => onLocate(entry.path)}
            >
              <strong>{tr(entry.label, locale)}</strong>
              <code>{entry.path}</code>
              <small>
                {entry.status === "legacy"
                  ? t(
                      "Legacy definition · retained",
                      "Définition ancienne · conservée",
                      "تعريف سابق محفوظ",
                    )
                  : tr(
                      SECTION_LABELS[entry.section] || [
                        entry.section,
                        entry.section,
                        entry.section,
                      ],
                      locale,
                    )}
                {entry.definition?.classification === "private" ? " · 🔒" : ""}
              </small>
            </button>
          ))}
        </div>
      </details>
      <details className={s.tools}>
        <summary>
          {t(
            "Language comparison & translation controls",
            "Comparaison des langues et traductions",
            "مقارنة اللغات والتحكم بالترجمة",
          )}
        </summary>
        <div className={s.actions}>
          <label>
            {t("Source language", "Langue source", "لغة المصدر")}{" "}
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value as Locale)}
            >
              {["en", "fr", "ar"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <input
            type="search"
            aria-label={t(
              "Search translated fields",
              "Rechercher un champ traduit",
              "البحث في الحقول المترجمة",
            )}
            value={languageSearch}
            onChange={(e) => {
              setLanguageSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <p>
          {t(
            "Copying text does not approve a translation.",
            "Copier un texte ne valide pas sa traduction.",
            "نسخ النص لا يعتمد ترجمته.",
          )}
        </p>
        {translations.slice(page * 20, page * 20 + 20).map((cell) => (
          <div className={s.languageRow} key={cell.path}>
            <strong>{tr(cell.label, locale)}</strong>
            <div dir={sourceLanguage === "ar" ? "rtl" : "ltr"}>
              <small>{sourceLanguage.toUpperCase()}</small>
              <p>{cell.values[sourceLanguage] || "—"}</p>
            </div>
            <div dir={language === "ar" ? "rtl" : "ltr"}>
              <small>{language.toUpperCase()}</small>
              <p>{cell.values[language] || "—"}</p>
            </div>
            <div className={s.actions}>
              <Button
                onClick={() =>
                  onLocate("locales." + language + "." + cell.path)
                }
              >
                <T v={["Edit", "Modifier", "تحرير"]} />
              </Button>
              <Button
                disabled={
                  readOnly ||
                  busy ||
                  sourceLanguage === language ||
                  !cell.values[sourceLanguage]
                }
                onClick={() => {
                  if (
                    cell.values[language] &&
                    !confirm(
                      t(
                        "Replace this authored translation?",
                        "Remplacer cette traduction rédigée ?",
                        "استبدال هذه الترجمة؟",
                      ),
                    )
                  )
                    return;
                  onChange(
                    translatedPatch(
                      object(record.data),
                      cell.path,
                      language,
                      cell.values[sourceLanguage],
                    ),
                  );
                }}
              >
                <T v={["Copy source", "Copier la source", "نسخ المصدر"]} />
              </Button>
            </div>
          </div>
        ))}
        <div className={s.actions}>
          <Button disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
            ←
          </Button>
          <span>
            {page + 1} / {Math.max(1, Math.ceil(translations.length / 20))}
          </span>
          <Button
            disabled={(page + 1) * 20 >= translations.length}
            onClick={() => setPage((n) => n + 1)}
          >
            →
          </Button>
        </div>
      </details>
    </div>
  );
}
export function SavedExperiencePreview({
  record,
  language,
  dirty,
  onSave,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  dirty: boolean;
  onSave: () => Promise<DceRecord | undefined>;
}) {
  const { locale, preview } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale);
  const ref = packageForLocale(object(record.data), language),
    html = isHtmlDelivery(object(record.data), language),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [bindings, setBindings] = useState<Data | null>(null);
  useEffect(() => {
    let live = true;
    setUrl("");
    setError("");
    setBindings(null);
    if (dirty) return;
    if (!html) {
      if (record.id)
        void mutate<any>({ action: "preview", id: record.id, locale: language })
          .then((r) => {
            if (live) setBindings(r.bindings);
          })
          .catch((e) => {
            if (live) setError(e.message);
          });
      return () => {
        live = false;
      };
    }
    if (!text(ref.id)) {
      setError("INTERACTIVE_PACKAGE_REQUIRED_FOR_LOCALE");
      return;
    }

    fetch(
      "/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package?" +
        new URLSearchParams({ operation: "info", id: text(ref.id) }),
      { credentials: "same-origin", cache: "no-store" },
    )
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.error || "PREVIEW_UNAVAILABLE");
        return b.data;
      })
      .then((r) => {
        if (live) setUrl(r.previewUrl);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [
    record.id,
    record.revision,
    ref.id,
    ref.checksum,
    language,
    html,
    dirty,
    reload,
  ]);
  return (
    <div className={s.gate}>
      <div className={s.actions}>
        <h2>
          {t(
            "Saved experience preview",
            "Aperçu de l’expérience enregistrée",
            "معاينة التجربة المحفوظة",
          )}
        </h2>
        {!html && (
          <Button
            disabled={!record.id || dirty}
            onClick={() => preview(record.id!, undefined, language)}
          >
            <T
              v={[
                "Open full saved preview",
                "Ouvrir l’aperçu complet",
                "فتح المعاينة الكاملة",
              ]}
            />
          </Button>
        )}
      </div>
      {dirty ? (
        <div className={s.notice}>
          <p>
            {t(
              "Save to preview the exact server revision.",
              "Enregistrez pour prévisualiser la version serveur exacte.",
              "احفظ لمعاينة نسخة الخادم الدقيقة.",
            )}
          </p>
          <Button kind="primary" onClick={onSave}>
            <T
              v={[
                "Save & refresh preview",
                "Enregistrer et actualiser",
                "حفظ وتحديث المعاينة",
              ]}
            />
          </Button>
        </div>
      ) : html ? (
        error ? (
          <div className={s.error} role="alert">
            {error}
            <Button onClick={() => setReload((n) => n + 1)}>
              <T v={["Retry", "Réessayer", "إعادة المحاولة"]} />
            </Button>
          </div>
        ) : url ? (
          <iframe
            title={t(
              "Isolated HTML experience",
              "Expérience HTML isolée",
              "تجربة HTML معزولة",
            )}
            className={s.preview}
            src={url}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
          />
        ) : (
          <p role="status">
            {t(
              "Loading protected HTML preview…",
              "Chargement de l’aperçu HTML protégé…",
              "تحميل المعاينة المحمية…",
            )}
          </p>
        )
      ) : error ? (
        <div role="alert" className={s.error}>
          {error}
        </div>
      ) : !bindings ? (
        <p role="status">…</p>
      ) : (
        <Suspense fallback={<p>…</p>}>
          <RuntimePreview
            record={record as DceRecord}
            locale={language}
            device="desktop"
            bindings={bindings}
          />
        </Suspense>
      )}
    </div>
  );
}
