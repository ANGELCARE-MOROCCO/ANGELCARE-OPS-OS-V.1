import { record, type Row } from "./model";
export type Recovery =
  | "retry"
  | "configuration"
  | "policy"
  | "source"
  | "rescan"
  | "inspect";
export function recovery(code: unknown): {
  kind: Recovery;
  label: string;
  detail: string;
} {
  const c = String(code || "");
  if (
    /ROBOTS_DISALLOWED|PRIVATE|PATH_REFUSED|ORIGIN_REFUSED|SSRF|UNSAFE|DNS|REDIRECT_REFUSED/.test(
      c,
    )
  )
    return {
      kind: "policy",
      label: "Examiner la règle",
      detail:
        "Consulter robots.txt et le périmètre public. Aucun contournement des routes privées ou protections réseau.",
    };
  if (
    /INDEXNOW_DISABLED|INDEXNOW_KEY|INDEXNOW_CONFIGURATION|SCHEDULER|NODE|DATABASE|MIGRATION/.test(
      c,
    )
  )
    return {
      kind: "configuration",
      label: "Configurer",
      detail:
        "Corriger la configuration avant de relancer. Une nouvelle tentative automatique ne résout pas ce blocage.",
    };
  if (/STALE|SUPERSEDED|CRAWL_REQUIRED|NOT_INDEXABLE/.test(c))
    return {
      kind: "rescan",
      label: "Actualiser la page",
      detail:
        "Relancer une exploration de la page et préparer une vérification de la publication courante.",
    };
  if (/BODY_ADAPTER|NATIVE_PAGE|PUBLICATION_BLOCKED|REVIEW_REQUIRED/.test(c))
    return {
      kind: "source",
      label: "Ouvrir les corrections",
      detail:
        "Utiliser la source native et les droits de publication. Les changements de code passent par le déploiement habituel.",
    };
  if (
    /TIMEOUT|NETWORK|ROBOTS_UNAVAILABLE|EXECUTION_FAILED|INDEXNOW_REFUSED|ECONN|FETCH/.test(
      c,
    )
  )
    return {
      kind: "retry",
      label: "Réessayer",
      detail:
        "Incident de transport : reprise bornée avec délai, puis intervention si trois tentatives échouent.",
    };
  return {
    kind: "inspect",
    label: "Examiner le résultat",
    detail:
      "Erreur non classée : arrêt explicite pour examen, sans boucle de nouvelles tentatives.",
  };
}
export function health(project: Row, runtime: Row, now = Date.now()) {
  const n = (k: string) => Number(project[k] || 0),
    execution = record(project.execution),
    policy = record(project.policy);
  const finished = Date.parse(String(execution.finished_at || "")),
    start = Date.parse(String(execution.started_at || ""));
  const budget = Number(policy.crawlBudget || 120),
    scheduled = policy.scheduleEnabled === true;
  if (project.enabled !== true)
    return {
      state: "paused",
      label: "En pause",
      reason: "Cet univers n’accepte pas de nouvelles tâches.",
    };
  if (n("running") > 0)
    return {
      state: "working",
      label: "En exécution",
      reason: `${n("running")} tâche(s) avec un bail actif.`,
    };
  if (
    n("expired") > 0 ||
    (execution.state === "running" && now - start > 120000)
  )
    return {
      state: "blocked",
      label: "Exécution interrompue",
      reason:
        "Un bail ou une exécution est périmé. Relancer le moteur pour récupérer les tâches.",
    };
  if (n("failed") + n("followup") + n("mismatches") > 0)
    return {
      state: "degraded",
      label: "Intervention requise",
      reason:
        "Des échecs, suites incomplètes ou vérifications non conformes demandent une action.",
    };
  if (
    scheduled &&
    (runtime.enabled !== true ||
      !runtime.cron ||
      !runtime.net ||
      !runtime.vault)
  )
    return {
      state: "blocked",
      label: "Automatisation bloquée",
      reason:
        "La planification de cet univers est demandée, mais le moteur ou une extension manque.",
    };
  if (n("due") > 0 && n("used") >= budget)
    return {
      state: "waiting",
      label: "Budget atteint",
      reason:
        "Les tâches restent conservées. Reprise au prochain jour UTC ou après modification du budget.",
    };
  if (
    n("due") > 0 &&
    scheduled &&
    (!Number.isFinite(finished) || now - finished > 180000)
  )
    return {
      state: "blocked",
      label: "File sans exécution confirmée",
      reason:
        "Des tâches sont dues mais aucune exécution récente n’est confirmée.",
    };
  if (n("waiting") > 0)
    return {
      state: "waiting",
      label: "En attente",
      reason: scheduled
        ? "Prochain passage planifié ou délai de reprise."
        : "Exécution manuelle attendue ; automatisation de cet univers désactivée.",
    };
  if (!Number.isFinite(finished))
    return {
      state: "unverified",
      label: "Non vérifié",
      reason: "Aucune exécution terminée et enregistrée pour cet univers.",
    };
  if (execution.state === "failed" || execution.state === "degraded")
    return {
      state: "degraded",
      label: "Dernier passage à examiner",
      reason: "Le moteur a répondu avec un résultat incomplet ou un échec.",
    };
  return {
    state: "idle",
    label: "À jour côté moteur",
    reason:
      "Dernier passage terminé ; aucune tâche en attente. La fraîcheur des pages est indiquée séparément.",
  };
}
export function batchMessage(value: unknown) {
  const v = record(value),
    rows = Array.isArray(v.results) ? v.results.map(record) : [];
  const problems = rows.filter(
    (r) =>
      r.error ||
      r.state === "unconfirmed" ||
      r.state === "failed" ||
      r.verified === false ||
      r.followup,
  ).length;
  if (v.fatal)
    return "Exécution interrompue. Consultez le journal et les tâches conservées.";
  if (!rows.length)
    return "Aucune tâche prise : file vide, délai, pause, concurrence ou budget. Consultez les indicateurs par univers.";
  return `${rows.length} tâche(s) traitée(s) · ${problems} résultat(s) à examiner. Les tâches restantes restent dans la file.`;
}
