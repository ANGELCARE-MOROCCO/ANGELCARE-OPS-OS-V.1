"use client";
import { useEffect, useState } from "react";
import type { Locale } from "../types";
import { tr } from "../types";
import { Button, Panel } from "./ui";
export function PublicReachability({ resourceKey, language, revision, onLocate }: { resourceKey: string; language: Locale; revision?: number; onLocate?: (path: string) => void }) {
  const [result, setResult] = useState<any>(null), [retry, setRetry] = useState(0), [busy, setBusy] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setBusy(true);
    const timeout = setTimeout(() => { controller.abort(); setResult({ code: "PUBLIC_CHECK_TIMEOUT" }); setBusy(false); }, 20000);
    fetch("/api/kidflix/publication-status?" + new URLSearchParams({ key: resourceKey, locale: language }), { cache: "no-store", signal: controller.signal })
      .then(async r => { const v = await r.json(); if (!controller.signal.aborted) setResult(v); })
      .catch(e => { if (e.name !== "AbortError") setResult({ code: "PUBLIC_JOURNEY_UNAVAILABLE" }); })
      .finally(() => { clearTimeout(timeout); if (!controller.signal.aborted) setBusy(false); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [resourceKey, language, revision, retry]);
  const labels: Record<string, [string,string,string]> = {
    configuration: ["Public domain and language", "Domaine et langue publics", "النطاق واللغة العامان"],
    edition: ["Current public edition", "Édition publique active", "النسخة العامة النشطة"],
    discovery: ["General discovery", "Découverte générale", "الاستكشاف العام"],
    category: ["Category catalogue", "Catalogue de catégorie", "كتالوج الفئة"],
    detail: ["Detail data resolved", "Données de la page détaillée", "بيانات الصفحة التفصيلية"],
    cover: ["Storefront cover image", "Couverture de la carte publique", "صورة الغلاف العامة"],
    files: ["Public player media bindings", "Fichiers liés aux lecteurs publics", "ملفات المشغلات العامة"]
  };
  const names: Record<string, [string,string,string]> = {
    PUBLIC_HOME_BINDING_REQUIRED: ["Activate the homepage domain for this language.", "Activez le domaine public de l’accueil pour cette langue.", "فعّل نطاق الصفحة الرئيسية لهذه اللغة."],
    NO_PUBLIC_EDITION_IN_THIS_SCOPE: ["No active public edition was found for this language.", "Aucune édition publique active trouvée dans cette langue.", "لم تُعثر على نسخة عامة نشطة بهذه اللغة."],
    PUBLIC_CHECK_TIMEOUT: ["The check timed out. Retry without publishing again.", "Le contrôle a expiré. Réessayez sans republier.", "انتهت مهلة الفحص. أعد المحاولة دون إعادة النشر."],
    PUBLIC_JOURNEY_UNAVAILABLE: ["A public service could not be checked. The saved edition is preserved.", "Un service public n’a pas pu être contrôlé. L’édition enregistrée est conservée.", "تعذر فحص خدمة عامة. النسخة المحفوظة محفوظة."],
    CATEGORY_CHECK_BUDGET_REACHED: ["The catalogue check is incomplete; open the category to verify.", "Le contrôle du catalogue est incomplet ; ouvrez la catégorie pour vérifier.", "فحص الكتالوج غير مكتمل؛ افتح الفئة للتحقق."]
  };
  return <Panel title={tr(["Public journey", "Parcours public", "المسار العام"], language)}>
    <p role="status">{busy ? tr(["Checking…", "Vérification…", "جارٍ التحقق…"],language) : result?.status === "ready" ? tr(["Public data checks passed", "Contrôles des données publiques réussis", "نجحت فحوص البيانات العامة"],language) : tr(["Public access needs attention", "Accès public à corriger", "الوصول العام يحتاج إلى تصحيح"],language)}</p>
    {result?.code && names[result.code] ? <p>{tr(names[result.code],language)}</p> : null}
    {result?.checks ? <ul>{Object.entries(result.checks).map(([key, passed]) => <li key={key}>{passed ? "✓" : "!"} {tr(labels[key] || [key,key,key],language)}</li>)}</ul> : null}
    {Array.isArray(result?.issues) && result.issues.length ? <ul>{result.issues.map((issue:any,i:number) => <li key={issue.path+":"+i}>{Array.isArray(issue.message) ? tr(issue.message,language) : issue.code}{onLocate && issue.path ? <Button onClick={() => onLocate(issue.path)}>{tr(["Fix this field", "Corriger ce champ", "تصحيح هذا الحقل"],language)}</Button> : null}</li>)}</ul> : null}
    <p>{tr(["These checks verify published data and usable URLs. Open the public page to test the actual reader and download.", "Ces contrôles vérifient les données publiées et les URL utilisables. Ouvrez la page publique pour tester le lecteur et le téléchargement.", "تتحقق هذه الفحوص من البيانات المنشورة والروابط القابلة للاستخدام. افتح الصفحة العامة لاختبار القارئ والتنزيل."],language)}</p>
    <Button disabled={busy} onClick={() => setRetry(x => x + 1)}>{tr(["Check again", "Vérifier à nouveau", "التحقق مجدداً"],language)}</Button>
    {result?.href ? <p><a href={result.href} target="_blank" rel="noopener noreferrer">{tr(["Open actual public page", "Ouvrir la vraie page publique", "فتح الصفحة العامة الفعلية"],language)} ↗</a></p> : null}
    {result?.categoryHref ? <p><a href={result.categoryHref} target="_blank" rel="noopener noreferrer">{tr(["Open this language’s storefront", "Ouvrir la catégorie dans cette langue", "فتح الفئة بهذه اللغة"],language)} ↗</a></p> : null}
    {result?.allLanguagesHref ? <p><a href={result.allLanguagesHref} target="_blank" rel="noopener noreferrer">{tr(["Browse all content languages", "Afficher toutes les langues de contenu", "عرض جميع لغات المحتوى"],language)} ↗</a></p> : null}
  </Panel>;
}
