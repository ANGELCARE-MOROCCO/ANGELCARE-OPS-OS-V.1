"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  array,
  object,
  text,
  tr,
  type DceRecord,
  type Json,
  type Locale,
} from "../types";
import type { GateDiagnostic } from "../publication-gate";
import { packageForLocale, isHtmlDelivery } from "../delivery-contract";
import { deliveryRepairPlan } from "../delivery-repair";
import { familyByKey } from "../registry";
import { queueFile, uploadCreationFile } from "../creation-upload";
import { Button, Badge, T, query, useReceiptMutation, useUI } from "./ui";
import s from "./dossier-workspace.module.css";
type Gate = {
  revision: number;
  fingerprint: string;
  locale: Locale;
  checkedAt: string;
  valid: boolean;
  diagnostics: GateDiagnostic[];
  history: any[];
  status: string;
};
export function PublicationGate({
  record,
  language,
  dirty,
  readOnly,
  onSave,
  onPersisted,
  onBusy,
  onLocate,
  onRefresh,
  renderSpecialist,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  dirty: boolean;
  readOnly: boolean;
  onSave?: () => Promise<DceRecord | undefined>;
  onPersisted?: (r: DceRecord) => void;
  onBusy?: (busy: boolean) => void;
  onLocate?: (path: string) => void;
  onRefresh?: () => void;
  renderSpecialist?: (path: string) => ReactNode;
}) {
  const { locale, boot } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale);
  const [gate, setGate] = useState<Gate | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0),
    [receipt, setReceipt] = useState<any>(null);
  const mutate = useReceiptMutation(),
    epoch = useRef(0);
  useEffect(() => {
    const token = ++epoch.current;
    setGate(null);
    setError("");
    setReceipt(null);
    if (!record.id || dirty) return;
    const controller = new AbortController();
    setLoading(true);
    query<Gate>(
      {
        op: "publication_gate",
        id: record.id,
        locale: language,
        revision: record.revision,
      },
      controller.signal,
    )
      .then((g) => {
        if (epoch.current === token) setGate(g);
      })
      .catch((e) => {
        if (!controller.signal.aborted && epoch.current === token)
          setError(e.message);
      })
      .finally(() => {
        if (epoch.current === token) setLoading(false);
      });
    return () => controller.abort();
  }, [record.id, record.revision, language, dirty, version]);
  async function apply(issue: GateDiagnostic, value: Json) {
    if (!gate || dirty || readOnly || busy || !onPersisted) return;
    setBusy(true);
    onBusy?.(true);
    setError("");
    const token = epoch.current;
    try {
      const result = await mutate<any>({
        action: "publication_repair",
        id: record.id,
        revision: gate.revision,
        locale: language,
        fingerprint: gate.fingerprint,
        path: issue.path,
        value,
      });
      if (token !== epoch.current) return;
      setGate(result.gate);
      setReceipt(result.receipt);
      onPersisted(result.record);
      onRefresh?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  const errors = gate?.diagnostics.filter((i) => i.severity === "error") || [],
    warnings = gate?.diagnostics.filter((i) => i.severity === "warning") || [];
  return (
    <section
      className={s.gate}
      data-testid="publication-repair-gate"
      aria-busy={loading || busy}
    >
      <header className={s.gateHeader}>
        <div>
          <span className={s.eyebrow}>
            {t(
              "FINAL PUBLICATION CHECK",
              "VÉRIFICATION FINALE",
              "فحص النشر النهائي",
            )}
          </span>
          <h2>
            {dirty
              ? t(
                  "Save & check your changes",
                  "Enregistrer et vérifier vos modifications",
                  "احفظ وافحص التغييرات",
                )
              : loading
                ? t(
                    "Checking saved edition…",
                    "Vérification de l’édition enregistrée…",
                    "فحص النسخة المحفوظة…",
                  )
                : gate?.valid
                  ? t(
                      "Ready for editorial review",
                      "Prête pour revue éditoriale",
                      "جاهزة للمراجعة التحريرية",
                    )
                  : gate
                    ? t(
                        "Resolve the remaining decisions here",
                        "Résoudre ici les dernières décisions",
                        "عالج القرارات المتبقية هنا",
                      )
                    : t(
                        "Checks awaiting a saved edition",
                        "Contrôles en attente d’une édition enregistrée",
                        "الفحوص بانتظار نسخة محفوظة",
                      )}
          </h2>
          <p>
            {t(
              "Choose a correction, apply it here, and the server checks the result again.",
              "Choisissez une correction, appliquez-la ici : le serveur contrôle à nouveau le résultat.",
              "اختر تصحيحاً وطبقه هنا؛ يفحص الخادم النتيجة مجدداً.",
            )}
          </p>
        </div>
        <div className={s.actions}>
          {dirty || !record.id ? (
            <Button
              kind="primary"
              disabled={readOnly || busy || !onSave}
              onClick={onSave}
            >
              <T
                v={["Save & run checks", "Enregistrer et vérifier", "حفظ وفحص"]}
              />
            </Button>
          ) : (
            <Button
              disabled={loading || busy}
              onClick={() => {
                setVersion((n) => n + 1);
                onRefresh?.();
              }}
            >
              <T v={["Recheck all", "Tout revérifier", "إعادة فحص الكل"]} />
            </Button>
          )}
        </div>
      </header>
      {error && (
        <div className={s.error} role="alert">
          <strong>
            {t(
              "The check or repair could not complete",
              "Le contrôle ou la correction n’a pas abouti",
              "لم يكتمل الفحص أو التصحيح",
            )}
          </strong>
          <p>{error}</p>
          <p>
            {t(
              "No successful result is assumed. Retry the operation; a revision conflict requires loading the latest dossier before deciding which edits to keep.",
              "Aucun succès n’est supposé. Réessayez ; un conflit de version nécessite de charger le dossier actuel avant de choisir les modifications à conserver.",
              "لا نفترض النجاح. أعد المحاولة؛ يتطلب تعارض النسخ تحميل الملف الحالي واختيار التعديلات المحفوظة.",
            )}
          </p>
          <Button onClick={() => setVersion((n) => n + 1)}>
            <T v={["Retry checks", "Relancer les contrôles", "إعادة الفحص"]} />
          </Button>
        </div>
      )}
      {gate && !dirty && (
        <>
          <div className={s.metrics}>
            <div>
              <strong>{errors.length}</strong>
              <small>
                {t(
                  "Decisions blocking publication",
                  "Décisions bloquantes",
                  "قرارات تمنع النشر",
                )}
              </small>
            </div>
            <div>
              <strong>{warnings.length}</strong>
              <small>
                {t(
                  "Warnings to review",
                  "Avertissements à revoir",
                  "تنبيهات للمراجعة",
                )}
              </small>
            </div>
            <div>
              <strong>{gate.history.length}</strong>
              <small>
                {t(
                  "Recent repair receipts",
                  "Reçus de correction récents",
                  "إيصالات التصحيح الأخيرة",
                )}
              </small>
            </div>
            <p>
              <code>
                r{gate.revision} · {language.toUpperCase()} · {gate.checkedAt}
              </code>
            </p>
          </div>
          {receipt && (
            <div className={s.receipt} role="status">
              {t(
                "Correction saved and rechecked",
                "Correction enregistrée et revérifiée",
                "حُفظ التصحيح وأعيد فحصه",
              )}{" "}
              · <code>{receipt.requestId}</code>
            </div>
          )}
          {!gate.diagnostics.length && (
            <div className={s.empty}>
              {t(
                "These server checks returned no blockers. Editorial approval and public availability are checked separately below.",
                "Ces contrôles serveur ne signalent aucun blocage. L’approbation éditoriale et la disponibilité publique sont contrôlées séparément ci-dessous.",
                "لم ترجع فحوص الخادم عوائق. يُفحص الاعتماد التحريري والتوفر العام بشكل مستقل أدناه.",
              )}
            </div>
          )}
          {gate.diagnostics.map((issue) => (
            <GateIssue
              key={issue.id + gate.revision}
              record={record as DceRecord}
              language={language}
              issue={issue}
              disabled={busy || readOnly || !onPersisted}
              canUpload={boot.actor.rights.media}
              onApply={(value) => apply(issue, value)}
              onLocate={onLocate}
              specialist={
                issue.control.kind === "decision"
                  ? renderSpecialist?.(issue.path)
                  : null
              }
            />
          ))}
          {isHtmlDelivery(object(record.data), language) && (
            <div className={s.inactive}>
              <strong>
                {t(
                  "HTML delivery profile",
                  "Profil de diffusion HTML",
                  "ملف عرض HTML",
                )}
              </strong>
              <p>
                {t(
                  "The package supplies its own cards and interactions. Native sorting, audio and collection minimums are inactive for this HTML release. Their saved settings remain available when selecting native delivery.",
                  "Le package fournit ses cartes et interactions. Le tri natif, l’audio et les minimums de collections sont inactifs pour cette édition HTML. Leurs réglages conservés restent accessibles en diffusion native.",
                  "توفر الحزمة بطاقاتها وتفاعلاتها. تتوقف متطلبات الفرز والصوت والمجموعات الأصلية لهذا الإصدار، وتبقى إعداداتها محفوظة للعرض الأصلي.",
                )}
              </p>
            </div>
          )}
          {!!gate.history.length && (
            <details className={s.tools}>
              <summary>
                {t(
                  "Repair evidence & original values",
                  "Preuves de correction et valeurs d’origine",
                  "أدلة التصحيح والقيم الأصلية",
                )}
              </summary>
              {gate.history
                .slice()
                .reverse()
                .map((h) => (
                  <div className={s.evidence} key={h.requestId}>
                    <strong>{h.path}</strong>
                    <p>
                      {JSON.stringify(h.before)} → {JSON.stringify(h.after)}
                    </p>
                    <code>
                      {h.requestId} · {h.at} · r{h.revisionBefore}
                    </code>
                  </div>
                ))}
            </details>
          )}
        </>
      )}
    </section>
  );
}
function GateIssue({
  record,
  language,
  issue,
  disabled,
  canUpload,
  onApply,
  onLocate,
  specialist,
}: {
  record: DceRecord;
  language: Locale;
  issue: GateDiagnostic;
  disabled: boolean;
  canUpload: boolean;
  specialist?: ReactNode;
  onApply: (value: Json) => Promise<void>;
  onLocate?: (path: string) => void;
}) {
  const { locale } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale),
    control = issue.control;
  const [value, setValue] = useState<Json>(
      control.kind === "multi"
        ? text(issue.current)
            .split(/\r?\n/)
            .filter((v) => control.options?.some((o) => o.value === v))
            .join("\n")
        : (issue.current ?? ""),
    ),
    [options, setOptions] = useState<any[]>([]),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [packageCover, setPackageCover] = useState<{
      id: string;
      declared: string;
      paths: string[];
    } | null>(null),
    [coverPath, setCoverPath] = useState("");
  const remote = ["media", "topic", "record", "offers", "package"].includes(
      control.kind,
    ),
    file = useRef<HTMLInputElement>(null),
    family = familyByKey(record.family || ""),
    suggestion = family
      ? deliveryRepairPlan(record, family).find((r) => r.path === control.path)
      : undefined;
  useEffect(() => {
    if (!remote) return;
    const stop = new AbortController(),
      timer = setTimeout(() => {
        setLoading(true);
        setError("");
        query<any>(
          {
            op: "publication_options",
            id: record.id,
            locale: language,
            path: issue.path,
            q: search,
            page,
          },
          stop.signal,
        )
          .then((result) => {
            setOptions(result.rows || []);
            setTotal(result.total || 0);
          })
          .catch((e) => {
            if (!stop.signal.aborted) setError(e.message);
          })
          .finally(() => {
            if (!stop.signal.aborted) setLoading(false);
          });
      }, 250);
    return () => {
      clearTimeout(timer);
      stop.abort();
    };
  }, [remote, record.id, language, issue.path, search, page]);
  useEffect(() => {
    const packageId = text(packageForLocale(record.data, language).id);
    if (issue.path !== "coverAssetId" || !packageId || !canUpload) return;
    const stop = new AbortController();
    fetch(
      "/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package?" +
        new URLSearchParams({ operation: "info", id: packageId }),
      { credentials: "same-origin", cache: "no-store", signal: stop.signal },
    )
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error || "PACKAGE_COVER_UNAVAILABLE");
        return body.data;
      })
      .then((info) => {
        if (stop.signal.aborted) return;
        const paths = (info.files || [])
            .filter((f: any) => f.mime === "image/png")
            .map((f: any) => f.path),
          declared = text(
            info.manifest?.cover || info.manifest?.editorial?.cover,
          );
        setPackageCover({
          id: packageId,
          paths,
          declared: paths.includes(declared) ? declared : "",
        });
        setCoverPath(paths.includes(declared) ? declared : "");
      })
      .catch((e) => {
        if (!stop.signal.aborted) setError(e.message);
      });
    return () => stop.abort();
  }, [record.id, language, issue.path, canUpload]);
  async function promotePackageCover() {
    if (!packageCover || !coverPath) return;
    setError("");
    try {
      const response = await fetch(
        "/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package?" +
          new URLSearchParams({
            operation: "asset",
            id: packageCover.id,
            path: coverPath,
          }),
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) throw Error("PACKAGE_COVER_UNAVAILABLE");
      await uploadCover(
        new File(
          [await response.blob()],
          coverPath.split("/").pop() || "cover.png",
          { type: "image/png" },
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function uploadCover(input: File) {
    setError("");
    setProgress(0);
    try {
      if (input.type !== "image/png")
        throw Error(
          t(
            "Select a PNG image.",
            "Choisissez une image PNG.",
            "اختر صورة PNG.",
          ),
        );
      const r = await uploadCreationFile(
        input,
        queueFile(input, {
          resource: record.id,
          collection: "@root",
          unit: "",
          field: "coverAssetId",
          locale: language,
        }),
        (c) => setProgress(c.progress ?? 0),
        new AbortController().signal,
      );
      if (!r.assetId) throw Error("COVER_REGISTRATION_FAILED");
      await onApply(r.assetId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  }
  return (
    <article className={s.issue} data-gate-path={issue.path}>
      <header>
        <h3>{tr(issue.title, locale)}</h3>
        <Badge tone={issue.severity === "error" ? "orange" : "blue"}>
          {issue.severity === "error"
            ? t("Decision required", "Décision requise", "قرار مطلوب")
            : t("Review", "À revoir", "للمراجعة")}
        </Badge>
      </header>
      <p>{tr(issue.cause, locale)}</p>
      <p>
        <strong>{t("Effect: ", "Conséquence : ", "النتيجة: ")}</strong>
        {tr(issue.impact, locale)}
      </p>
      <details className={s.evidence}>
        <summary>
          {t(
            "Evidence & current value",
            "Preuve et valeur actuelle",
            "الدليل والقيمة الحالية",
          )}
        </summary>
        <code>
          {issue.codes.join(" · ")} · {issue.path}
        </code>
        <p>{JSON.stringify(issue.current)}</p>
        {issue.evidence?.map((message, i) => (
          <p key={i}>{tr(message, locale)}</p>
        ))}
      </details>
      {suggestion && (
        <div className={s.evidence}>
          <p>
            {t(
              "Proposed registered value",
              "Valeur enregistrée proposée",
              "القيمة المسجلة المقترحة",
            )}{" "}
            : <strong>{String(suggestion.after) || "—"}</strong>
          </p>
          <Button disabled={disabled} onClick={() => onApply(suggestion.after)}>
            <T
              v={[
                "Apply this reviewed correction",
                "Appliquer cette correction vérifiée",
                "تطبيق التصحيح المراجع",
              ]}
            />
          </Button>
        </div>
      )}
      {remote ? (
        <>
          <div className={s.options}>
            {
              <input
                type="search"
                aria-label={t(
                  "Search eligible choices",
                  "Rechercher des choix éligibles",
                  "البحث في الخيارات المؤهلة",
                )}
                placeholder={t(
                  "Search available choices…",
                  "Rechercher les choix disponibles…",
                  "البحث في الخيارات المتاحة…",
                )}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            }
            {control.kind === "media" &&
              issue.path === "coverAssetId" &&
              canUpload && (
                <>
                  <input
                    ref={file}
                    hidden
                    type="file"
                    accept="image/png"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) void uploadCover(selected);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    disabled={disabled || progress !== null}
                    onClick={() => file.current?.click()}
                  >
                    <T
                      v={[
                        "Upload cover PNG",
                        "Ajouter une couverture PNG",
                        "رفع غلاف PNG",
                      ]}
                    />
                  </Button>
                </>
              )}
          </div>
          {packageCover && packageCover.paths.length > 0 && (
            <div className={s.options}>
              <select
                aria-label={t(
                  "Package PNG cover",
                  "Couverture PNG du package",
                  "غلاف PNG للحزمة",
                )}
                value={coverPath}
                disabled={disabled || progress !== null}
                onChange={(e) => setCoverPath(e.target.value)}
              >
                <option value="">
                  {t(
                    "Choose a package PNG…",
                    "Choisir un PNG du package…",
                    "اختر PNG من الحزمة…",
                  )}
                </option>
                {packageCover.paths.map((path) => (
                  <option key={path} value={path}>
                    {path}
                    {path === packageCover.declared
                      ? " · " +
                        t(
                          "declared cover",
                          "couverture déclarée",
                          "الغلاف المعلن",
                        )
                      : ""}
                  </option>
                ))}
              </select>
              <Button
                disabled={disabled || progress !== null || !coverPath}
                onClick={promotePackageCover}
              >
                <T
                  v={[
                    "Use this package PNG",
                    "Utiliser ce PNG du package",
                    "استخدام PNG من الحزمة",
                  ]}
                />
              </Button>
            </div>
          )}
          {loading ? (
            <p role="status">
              {t(
                "Finding eligible options…",
                "Recherche des options éligibles…",
                "البحث عن الخيارات المؤهلة…",
              )}
            </p>
          ) : (
            <div className={s.options}>
              {options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  disabled={disabled || progress !== null}
                  onClick={() => onApply(option.id)}
                >
                  {option.url && (
                    <img
                      src={option.url}
                      alt=""
                      width={52}
                      height={52}
                      style={{
                        objectFit: "cover",
                        borderRadius: 6,
                        marginInlineEnd: 10,
                      }}
                    />
                  )}
                  <strong>{option.title || option.id}</strong>
                  <small> · {option.mime || option.key || option.locale}</small>
                </button>
              ))}
            </div>
          )}
          {!loading && !options.length && !error && (
            <p>
              {t(
                "No eligible option was returned for this search. Upload a source or select another search; no reference will be invented.",
                "Aucune option éligible pour cette recherche. Ajoutez une source ou modifiez la recherche ; aucune référence ne sera inventée.",
                "لم تظهر خيارات مؤهلة. أضف مصدراً أو غيّر البحث؛ لن تُختلق مراجع.",
              )}
            </p>
          )}
          {
            <div className={s.actions}>
              <Button
                disabled={page === 1 || loading}
                onClick={() => setPage((n) => n - 1)}
              >
                ←
              </Button>
              <span>
                {page} / {Math.max(1, Math.ceil(total / 24))}
              </span>
              <Button
                disabled={page * 24 >= total || loading}
                onClick={() => setPage((n) => n + 1)}
              >
                →
              </Button>
            </div>
          }
        </>
      ) : control.kind === "decision" ? (
        <div className={s.notice}>
          <p>
            {t(
              "This needs source content or a specialist configuration. The available correction area below identifies the exact control.",
              "Ce point nécessite un contenu source ou une configuration spécialisée. La zone de correction ci-dessous cible le réglage concerné.",
              "يتطلب هذا محتوى أصلياً أو إعداداً متخصصاً. تستهدف منطقة التصحيح أدناه الإعداد المعني.",
            )}
          </p>
          {specialist ? (
            <details className={s.tools}>
              <summary>
                {t(
                  "Correct here with the registered editor",
                  "Corriger ici dans l’éditeur enregistré",
                  "صحح هنا بالمحرر المسجل",
                )}
              </summary>
              {specialist}
            </details>
          ) : (
            onLocate && (
              <Button onClick={() => onLocate(issue.path)}>
                <T
                  v={[
                    "Open this exact control",
                    "Ouvrir ce réglage précis",
                    "فتح الإعداد المحدد",
                  ]}
                />
              </Button>
            )
          )}
        </div>
      ) : (
        <form
          className={s.options}
          onSubmit={(e) => {
            e.preventDefault();
            void onApply(value);
          }}
        >
          {control.kind === "multi" ? (
            <fieldset disabled={disabled}>
              <legend>
                {t(
                  "Choose verified classifications",
                  "Choisir les classifications vérifiées",
                  "اختر التصنيفات المعتمدة",
                )}
              </legend>
              {control.options?.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    margin: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={text(value).split(/\r?\n/).includes(option.value)}
                    onChange={(e) => {
                      const v = text(value).split(/\r?\n/).filter(Boolean);
                      setValue(
                        (e.target.checked
                          ? [...new Set([...v, option.value])]
                          : v.filter((k) => k !== option.value)
                        ).join("\n"),
                      );
                    }}
                  />
                  {tr(option.label, locale)}
                </label>
              ))}
            </fieldset>
          ) : control.kind === "select" ? (
            <select
              aria-label={tr(issue.title, locale)}
              value={text(value)}
              disabled={disabled}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">{t("Choose…", "Choisir…", "اختر…")}</option>
              {control.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {tr(o.label, locale)}
                </option>
              ))}
            </select>
          ) : control.kind === "toggle" ? (
            <label>
              <input
                disabled={disabled}
                type="checkbox"
                checked={value === true}
                onChange={(e) => setValue(e.target.checked)}
              />
              {tr(issue.title, locale)}
            </label>
          ) : control.kind === "textarea" ? (
            <textarea
              aria-label={tr(issue.title, locale)}
              disabled={disabled}
              value={text(value)}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <input
              aria-label={tr(issue.title, locale)}
              disabled={disabled}
              type={control.kind === "number" ? "number" : "text"}
              min={control.min}
              max={control.max}
              value={typeof value === "number" ? value : text(value)}
              onChange={(e) =>
                setValue(
                  control.kind === "number" && e.target.value !== ""
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          )}
          <Button type="submit" kind="primary" disabled={disabled}>
            <T
              v={[
                "Apply & recheck",
                "Appliquer et revérifier",
                "تطبيق وإعادة الفحص",
              ]}
            />
          </Button>
        </form>
      )}
      {progress !== null && (
        <p role="status">
          {t(
            "Registering native cover",
            "Enregistrement de la couverture",
            "تسجيل الغلاف",
          )}{" "}
          · {progress}%
        </p>
      )}
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
    </article>
  );
}
