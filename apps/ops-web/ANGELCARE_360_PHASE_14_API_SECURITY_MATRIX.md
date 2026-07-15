# ANGELCARE 360 Phase 14 API Security Matrix

| Route API | Actions supportées | Auth / session | Access context | Permissions | Validation | Audit | Risque destructif | Verdict |
|---|---|---|---|---|---|---|---|---|
| `/api/angelcare360/administration` | GET overview, POST mutations de configuration | Délégué aux helpers serveur | Oui, via `getAngelcare360AccessContext` / `requireAngelcare360Permission` | Oui, au niveau helper | Oui | Oui pour les mutations critiques | Pas de verbe DELETE exposé; suppressions internes contrôlées | OK |
| `/api/angelcare360/people` | POST mutations de dossiers / liens / documents | Délégué aux helpers serveur | Oui, via helpers people | Oui, au niveau helper | Oui | Oui | Pas de DELETE HTTP; nettoyage interne contrôlé lors de certains flux | OK avec note |
| `/api/angelcare360/admissions` | GET / POST admissions et conversions | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/attendance` | GET / POST présences et justifications | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/timetable` | GET / POST emploi du temps / calendrier | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/academics` | GET / POST cours, devoirs, examens, notes, bulletins, appréciations | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/finance` | GET / POST frais, factures, paiements, reçus, remises, relances, dépenses | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/payroll` | GET / POST périodes, dossiers, éléments, validation, paiements internes | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/transport` | GET / POST circuits, arrêts, véhicules, affectations, verrouillages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/library` | GET / POST livres, exemplaires, prêts, retours, blocages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/inventory` | GET / POST catégories, articles, mouvements, blocages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/communication` | GET / POST conversations, messages, annonces, modèles | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/notifications` | GET / POST notifications internes et canaux bloqués | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/claims` | GET / POST tickets, assignations, statuts, résolution | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/reports` | GET catalogue / historique / audit, POST modèles / demandes / blocages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/exports` | GET readiness / historique / audit, POST blocages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |
| `/api/angelcare360/documents` | GET readiness / templates / audit, POST templates / blocages | Délégué aux helpers serveur | Oui | Oui | Oui | Oui | Pas de DELETE HTTP exposé | OK |

## Conclusion
- Aucun route handler AngelCare 360 ne publie de verbe destructif HTTP.
- Les mutations passent par les helpers serveur où l’authentification, le contexte école, la permission et l’audit sont contrôlés.
- Les suppressions observées dans le code sont des nettoyages internes contrôlés, pas des endpoints publics.
