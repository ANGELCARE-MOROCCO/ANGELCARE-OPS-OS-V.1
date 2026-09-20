# AngelCare Marketplace Studio — Production Acceptance — 2026-09-19

## Mission
Transplanter les capacités du Design/Experience Studio donneur dans le Marketplace AngelCare sans transplanter son identité, son auth, son schéma de données, ses secrets ni ses hypothèses métier.

## Autorités conservées
- Auth/session/RBAC : AngelCare Marketplace.
- Persistance : Experience Core `angelcare_marketplace_cms_*` et RPC de draft/versioning déjà en place.
- Média : AngelCare Media Vault.
- Publication : gouvernance, secure preview et runtime public AngelCare existants.
- Marque : asset officiel `/brand/angelcare-official.webp` uniquement.
- Données commerce : repositories/catalogue réels existants ; aucune donnée commerciale fictive.

## Complétude ajoutée
- Catalogue visuel AngelCare 10 catégories × 10 expériences = 100 aliases Puck.
- Chaque alias se replie sur un type de bloc canonique existant en persistance.
- Métadonnées `studioVisualAlias`, `studioVisualCategory`, `studioVisualVariant` pour restauration exacte.
- Runtime visuel partagé auteur/public ; commerce publié reste alimenté par `searchDiscovery` et collections réelles.
- Recherche et filtre de blocs dans la bibliothèque Puck.
- Cartes premium de blocs avec aperçu de famille.
- Rails gauche/droite redimensionnables au pointeur et au clavier avec sémantique ARIA separator.
- Import/export JSON de page borné et validé.
- Duplication de page serveur avec URL libre, rekey des composants, audit et persistance canonique.
- Accès direct Media Vault et Developer Contract depuis la barre de commande.
- Developer Contract Studio TXT/CSV/JSON avec comptages dérivés des registres réels.
- Conservation des exports Experience Core historiques.

## Sécurité
- Aucun `eval`, `new Function` ou script étranger ajouté.
- Import JSON limité à 5 Mo, 750 composants et profondeur 28.
- Types de blocs non enregistrés refusés.
- Schémas `javascript:`, `vbscript:` et `data:text/html` refusés pour les destinations importées.
- Aucun secret/env/clé/service-role copié depuis le donneur.
- Aucun `localStorage`/`sessionStorage` ajouté comme persistance canonique.
- Aucun SQL/migration ajouté.

## Persistance et non-régression
AngelCare conserve son Experience Core transactionnel. Les composants Puck imbriqués restent dans le document JSON du bloc racine ; les lignes de blocs canoniques sont versionnées par l’autorité existante. La greffe n’ajoute aucun deuxième éditeur, aucun deuxième moteur de publication et aucun nouveau type DB pour les 100 expériences visuelles.

## Certification exécutée dans la capsule
- `node scripts/angelcare-marketplace/verify-design-studio-transplant.mjs` : PASS.
- Universal Studio : 37/37 tests PASS.
- Catégories visuelles : 10/10 PASS.
- Expériences visuelles : 100/100 présentes, 10 par catégorie.
- Round-trip alias/canonique/restauration : PASS.
- Sécurité import JSON : PASS.
- Transpilation syntaxique TypeScript/TSX des fichiers touchés : PASS.
- Recherche identité donneur dans la surface Studio transférée : aucune occurrence restante.

## Limite de certification de cette capsule
Le ZIP Marketplace fourni ne contient pas `node_modules`. Un `npm ci --offline` a été tenté mais le cache de l'environnement ne contient pas `zustand@5.0.15`; le typecheck complet du monorepo n'est donc pas exécutable dans cette capsule. Le package `VERIFY.py` relance la certification Studio et lance automatiquement `npx tsc --noEmit --pretty false` lorsqu'il est appliqué dans le repo réel avec ses dépendances installées. Aucun build production local n'est lancé.

## Release
Ce travail ne commit, ne push et ne déploie rien. La chaîne de release Marketplace reste : `apps/marketplace-web` → workflow GitHub Actions **Build Marketplace GHCR One-Off** → image GHCR taggée avec le SHA source exact → digest immutable → Coolify → deploy without cache.
