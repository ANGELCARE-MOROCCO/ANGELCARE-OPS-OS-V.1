"use client";
import { useEffect, useState } from "react";
import type { Locale } from "../types";
import { tr } from "../types";
import { Button, Panel } from "./ui";
export function PublicReachability({ resourceKey, language, revision }: { resourceKey: string; language: Locale; revision?: number }) {
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
    files: ["Reader file bindings", "Fichiers liés au lecteur", "ملفات القارئ المرتبطة"]
  };
  return <Panel title={tr(["Public journey · separate from publication", "Parcours public · distinct de la publication", "المسار العام · مستقل عن النشر"], language)}>
    <p role="status">{busy ? tr(["Checking…", "Vérification…", "جارٍ التحقق…"],language) : result?.status === "ready" ? tr(["Public data checks passed", "Contrôles des données publiques réussis", "نجحت فحوص البيانات العامة"],language) : tr(["Public access needs attention", "Accès public à corriger", "الوصول العام يحتاج إلى تصحيح"],language)}</p>
    {result?.code === "PUBLIC_HOME_BINDING_REQUIRED" ? <p>{tr(["Publish the homepage domain binding for this language. Publishing a resource alone does not activate this binding.", "Publiez le rattachement du domaine de l’accueil pour cette langue. Publier une ressource seule n’active pas ce rattachement.", "انشر ربط نطاق الصفحة الرئيسية لهذه اللغة. نشر المورد وحده لا يفعّل هذا الربط."],language)}</p> : result?.code ? <p>{result.code}</p> : null}
    {result?.checks ? <ul>{Object.entries(result.checks).map(([key, passed]) => <li key={key}>{passed ? "✓" : "!"} {tr(labels[key] || [key,key,key],language)}</li>)}</ul> : null}
    <p>{tr(["These checks resolve public data. Open the page to verify the rendered layout and actual PDF/media response.", "Ces contrôles vérifient les données publiques. Ouvrez la page pour vérifier le rendu et la réponse réelle du PDF ou média.", "تتحقق هذه الفحوص من البيانات العامة. افتح الصفحة للتحقق من العرض واستجابة PDF أو الوسائط."],language)}</p>
    <Button disabled={busy} onClick={() => setRetry(x => x + 1)}>{tr(["Check again", "Vérifier à nouveau", "التحقق مجدداً"],language)}</Button>
    {result?.href ? <a href={result.href} target="_blank" rel="noopener noreferrer">{tr(["Open actual public page", "Ouvrir la vraie page publique", "فتح الصفحة العامة الفعلية"],language)} ↗</a> : null}
  </Panel>;
}
