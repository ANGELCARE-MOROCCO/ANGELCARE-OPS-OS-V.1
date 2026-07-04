# AC360 Direction Final User Cleanup

This patch removes developer-facing wording from the visible Cockpit de Direction UI.

Cleaned examples:
- SQL requis / Persisté SQL / Migration SQL
- Phase labels
- runtime/fallback/internal wording
- raw payload JSON shown in action modal
- technical preflight wording

The cockpit now keeps business-facing language only:
- État opérationnel du cockpit
- Compte prêt / Configuration à finaliser
- Exécution sécurisée
- Vérification avant exécution
- Résumé de l’action
- Référence de preuve

No SQL migration required. This is a UI wording and action-modal cleanup patch.
