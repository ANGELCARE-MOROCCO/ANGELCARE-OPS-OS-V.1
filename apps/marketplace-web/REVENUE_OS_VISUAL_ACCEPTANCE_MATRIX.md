# Revenue OS — visual acceptance matrix

| Zone | Critère accepté | Vérification source / résultat |
|---|---|---|
| Fondation | Page claire, icy-blue/blanc, navy d’autorité, actions bleues, états green/amber/rose | `RevenueOsShell`, `Sovereignty.module.css`, composants route-level |
| Navigation | Une entrée sidebar par workspace canonique, état actif et `aria-current` | `REVENUE_OS_WORKSPACES`, `RevenueOsShell` — PASS |
| Contextualisation | Chaque route expose workspace courant, mode d’exécution, frontière d’approbation et lien audit | Nouveau context bar shell — PASS |
| Typographie | Titres, labels, métadonnées et valeurs business distincts; wrapping sûr | `RevenueVisualIntegrity.module.css` — PASS statique |
| Contraste | Surfaces light/dark explicitement séparées; contenu essentiel AA visé | `data-revenue-surface`, integrity rules, drawer rules — PASS statique |
| Focus | Boutons, liens et champs ont un focus visible | Integrity CSS + Action Center CSS — PASS |
| Tables | En-têtes sticky, overflow contrôlé, hiérarchie de ligne préservée | Integrity CSS + route tables — PASS statique |
| Drawers | Portals conservés; tailles compactes/opérationnelles; footer sticky; z-index dédié | `DrawerPrimitives`, `DrawerSovereignty.module.css` — PASS |
| Action Center | queued/validating/running/approval/success/partial/failure/cancelled, étape active, audit/résultat | `RevenueActionCenter` — PASS; progression indéterminée lorsque backend inconnu |
| Empty/degraded | Source, manque et action upstream expliqués sans records inventés | `SEmpty`, `SDataTruth`, route empty states — PASS statique |
| Responsive | Sidebar mobile, grilles fluides, wrapping français, no generic desktop drawer width | Shell + integrity/drawer media rules — PASS statique; rendu navigateur non exécuté |
| Canaux | Email OS autorité; Gmail direct désactivé; Calendar policy-disabled; WhatsApp manuel | `ChannelGovernancePanel`, Email Studio, Settings — PASS |
| Doctrine | 3 000 commandes canoniques et governance visibles | Constants, Command Kernel, Settings — PASS |

## Scénarios d’acceptation manuelle recommandés

1. Ouvrir Cockpit, Objectifs, Strategy, Conseil, Studio, Commands, Compiler, Execution et Audit à 1440/1280/1024/390 px.
2. Déclencher un run déjà autorisé et vérifier le Centre d’actions jusqu’au résultat/audit.
3. Ouvrir chaque tiroir mature, vérifier son scroll, son footer, Échap, fermeture overlay et absence de collision avec les outils flottants.
4. Tester zoom navigateur 200 %, chaînes françaises longues, codes de trace et tableaux larges.
