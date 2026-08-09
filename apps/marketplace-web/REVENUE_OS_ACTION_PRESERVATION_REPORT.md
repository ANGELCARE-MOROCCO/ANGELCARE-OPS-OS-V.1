# Revenue OS — action preservation report

## Périmètre contrôlé

L’upgrade a touché uniquement le shell visuel, la feuille d’intégrité visuelle et la feuille CSS du Centre d’actions. Aucun endpoint, hook de mutation, payload, permission, validation ou contrat de données Revenue OS n’a été modifié.

## Actions et workflows préservés

- Objectifs : composition manuelle, validation de formulaire, création, lancement de l’opération et import CSV `mandates`.
- Gemini & ressources : registre, import, sélection de ressource, run contrôlé, métriques de coût/token/latence et audit.
- Strategy Brain : génération, polling, retry, cancel, soumission Council.
- Council / Studio : délibération, approve, reject, amend, combine, request evidence/analysis, simulation, export memo.
- Command Kernel : catalogue, taxonomie, éligibilité, routage, déclencheurs, schedules, graphes, simulation, runs, versions, guardrails, validation et import CSV `commands`.
- Mission Compiler : preview, compile, recompile, partial recompile, validate, resolve conflict, reassign, propagation gate, rollback.
- Execution Autopilot : packages, adapters, queue, approve/reject/retry/dispatch, dead letters, failures, internal/external effect trace.
- Email Studio : mailbox assignée Email OS, drafts, scheduling, outbox, tracking, follow-ups; Gmail direct reste désactivé.
- Validations / Exceptions : décisions, corrections, diagnostic, retry/recovery, close/reopen/escalate selon les workflows déjà exposés.
- Doctrine & mémoire : doctrine drawer, CSV, version/provenance, conflits, approval desk, validation et indexation.
- Audit / Settings : lecture forensique, traces, configuration de gouvernance, kill switches et frontières d’exécution.

## Centre d’actions

Le Centre d’actions global reste monté dans `RevenueOsShell`, visible dans la navigation et observe uniquement les mutations `/api/revenue-command-os/` non marquées comme déjà gérées. Ses états, étapes, avertissements, résultats, audits et téléchargement de rapport sont conservés. Le rendu n’affiche pas de pourcentage précis pour un backend qui n’en fournit pas : il utilise l’étape active indéterminée.

## Modifications UX sans perte d’action

- Ajout de `aria-current="page"` sur la navigation active.
- Ajout d’un bandeau de contexte avec lien Audit; aucune action primaire n’est déplacée ni masquée.
- Focus clavier visible sur les contrôles Revenue OS.
- En-têtes de tableaux sticky et wrapping des codes/valeurs longs.
- Suppression de l’ellipsis du titre d’action du Centre d’actions afin de ne pas cacher une information critique.
