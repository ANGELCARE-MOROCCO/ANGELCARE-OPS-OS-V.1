# Localization OS — Guide opérateur

## Doctrine

Le français (`fr`) est la source maître. L’anglais (`en`) et l’arabe (`ar`) sont des traductions gérées de la version française courante. Créer ou modifier un contenu en français ne le publie jamais automatiquement dans une autre langue.

## Cycle normal

1. Travaillez normalement en français dans Produits, Catégories, Boutique, Marketing, Academy, B2B, Trust ou les autres workspaces Marketplace.
2. Stabilisez le contenu français.
3. Ouvrez **Boutique → Localization**.
4. Ouvrez **Sources** puis cliquez **Actualiser toutes les sources**.
5. Contrôlez les unités `NEW`, `SOURCE_CHANGED`, `MISSING`, `STALE`, `BLOCKED` ou `ORPHANED`.
6. Ouvrez **Traductions** pour filtrer par workspace, route, état ou locale.
7. Sélectionnez les unités utiles ou ouvrez **Export / Import** et choisissez un profil.
8. Téléchargez le CSV. Pour ChatGPT, téléchargez aussi le fichier d’instructions.
9. Modifiez uniquement `translation_en` et `translation_ar`. Ne modifiez jamais les identités, la source française ou son hash.
10. Importez le CSV puis exécutez obligatoirement le **dry-run serveur**.
11. Corrigez toutes les lignes `STALE_SOURCE`, `UNKNOWN_ID`, `INVALID_PLACEHOLDER`, `INVALID_HTML`, `INVALID_FORMAT`, `DUPLICATE`, `EMPTY_REQUIRED_TARGET`, `CONFLICT` ou `BLOCKED`.
12. Examinez la comparaison avant/import puis confirmez l’application des lignes `READY`.
13. Les valeurs importées restent `DRAFT`. Ouvrez **Traductions**, soumettez-les, faites-les approuver et publiez-les.
14. Vérifiez les liens Preview FR, EN et AR. L’arabe utilise `dir="rtl"` à la frontière Marketplace.
15. Si nécessaire, restaurez un import depuis son historique. Cette restauration remet chaque traduction dans son état précédent et retire celles créées uniquement par le lot.

## Contrat CSV

Les 24 colonnes sont : `translation_id`, `source_key`, `source_type`, `workspace`, `surface`, `route`, `entity_type`, `entity_id`, `field_name`, `context`, `source_locale`, `source_fr`, `translation_en`, `translation_ar`, `status_en`, `status_ar`, `source_hash`, `source_updated_at`, `translation_en_updated_at`, `translation_ar_updated_at`, `placeholder_rules`, `html_allowed`, `character_limit`, `notes`.

L’ordre des lignes n’a aucune autorité. Le rapprochement utilise `translation_id`, `source_key` et `source_hash`. Le dry-run refuse les sources françaises périmées, identités inconnues, doublons, conflits concurrents, placeholders perdus, HTML interdit/dangereux, cibles vides et limites dépassées.

## Placeholders et HTML

- Conservez exactement les variables telles que `{name}`, `{{product.title}}`, `%s` ou `:reference`.
- Ne traduisez jamais une variable, une URL, une devise ou une clé technique.
- Le HTML n’est accepté que pour les unités qui l’autorisent. Les balises doivent conserver la structure de la source ; scripts, handlers d’événements et URL `javascript:` sont bloqués.
- Respectez le glossaire AngelCare et les termes marqués « ne pas traduire ».

## Changement de la source française

Une nouvelle actualisation conserve l’identité stable de l’unité. Si le français change, son hash et sa version évoluent une seule fois, les traductions EN/AR publiées passent `STALE`, et le runtime n’expose plus l’ancienne traduction comme actuelle. Réexportez, retraduisez, faites approuver et republiez.

## Runtime et fallback

- FR affiche toujours la source canonique.
- EN et AR affichent uniquement une traduction `PUBLISHED`, `current` et liée au hash français courant.
- En l’absence de traduction publiée courante, le runtime conserve le français comme fallback.
- Les brouillons, rejets, traductions non approuvées, non publiées, orphelines ou stale ne sont jamais livrés.
- Les champs localisés natifs des entités restent prioritaires. Localization OS les alimente pour les bridges autorisés et fournit le même dictionnaire gouverné aux textes génériques publics, privés et Admin.

La publication invalide le tag de dictionnaire, le layout Marketplace et les routes FR/EN/AR concernées après l’écriture persistante. Le dictionnaire est chargé par pages de 1 000 lignes : il n’existe pas de plafond silencieux à 10 000 ou 20 000 unités. Les scopes privés et Admin exigent respectivement les permissions serveur Marketplace correspondantes ; seul le dictionnaire public est anonyme.

## Profils et volumes

Les profils **Nouveautés**, **Rattraper l’anglais**, **Rattraper l’arabe**, **Produits**, **Boutique publique**, **Interface Admin**, **Portail client**, **Checkout critique**, **SEO**, **Homepage / campagne**, **Changé depuis…** et **Personnalisé** ne créent aucun moteur parallèle : ils appliquent des filtres au registre unique. L’export « tout le filtre » est paginé côté serveur. L’import accepte jusqu’à 50 000 unités et 50 Mo, puis écrit ses preuves par lots ; au-delà, divisez volontairement le périmètre.

Le refresh de qualification du 30 août 2026 a découvert et persisté 22 617 unités actuelles : 20 583 unités statiques dans 1 961 fichiers et 2 034 champs d’entités issus de 84 autorités dynamiques. Un second refresh identique a produit zéro insertion, zéro changement, zéro retrait et zéro échec. Ces chiffres décrivent la vérité source observée à cette date ; ils évolueront avec le produit.

## Quality Command

La vue **Qualité** centralise les traductions EN/AR manquantes ou stale, sources françaises changées, placeholders perdus, HTML interdit, alertes RTL, sources orphelines/bloquées et unités nécessitant une décision humaine. Chaque anomalie conserve l’identité et la route de l’unité afin de revenir au registre sans interprétation manuelle.

## Qualification et readiness réelle

Le moteur FR/EN/AR et la publication ont été qualifiés avec des canaris réversibles sur la cible non-production : export, dry-run, application EN+AR en brouillon, rejet d’un placeholder invalide, rollback, résolution publique publiée EN/AR, suppression et idempotence du refresh. Après nettoyage, aucun canari ne subsiste en base.

La couverture métier courante reste distincte de la capacité du moteur : après nettoyage des canaris, 0 traduction EN et 0 traduction AR sont actuellement publiée/courante dans cette cible. L’opérateur doit donc exécuter le cycle de traduction et de publication avant de considérer EN ou AR comme complets. L’UAT visuelle authentifiée reste à effectuer lorsque la session Admin et le navigateur de validation sont disponibles.

## Permissions

Les permissions réelles distinguent accès, scan, consultation, édition, soumission, revue, approbation, publication, export, import, validation, application, rollback, glossaire, mémoire et SEO. Un bouton visible ne remplace jamais le contrôle serveur.
