# Catalogue & Population OS R1

Cette version couvre l’ensemble du catalogue, pas trois catégories choisies. La page d’entrée est `/angelcare-marketplace/admin/catalog/items`. Les entrées Catalogue, Produits et Catégories rejoignent ce poste ; les dossiers natifs individuels restent accessibles.

## Les cinq espaces

- **Couverture** : comptes serveur des offres canoniques hors archives, publication, absence de média principal/catégorie, complétude FR/EN/AR et schémas sans offre. Les branches vides restent visibles. Le total d’une branche déduplique les offres liées à plusieurs descendants ; le compte direct est affiché séparément.
- **Offres** : recherche serveur sur noms FR/EN/AR, clé, référence et SKU ; filtres catégorie et descendants, schéma, état et manque éditorial. Cartes et table, images contenues, sélection explicite de la page et export de cette sélection. Le dossier ouvre les contenus, médias, gates Product 360 et les autorités natives de prix, disponibilité et publication.
- **Ateliers** : profils dérivés des schémas actifs persistants, tous les champs natifs + Product 360 + doctrine obligatoire et facultative. CSV, guide et manifeste générés à la version actuelle ; éditeur par sections, recherche et requis. Le brouillon est retenu dans sessionStorage de cet onglet ; une indisponibilité du stockage local n’empêche pas l’export CSV. Ce n’est pas une sauvegarde cloud avant création du lot.
- **Médias** : bibliothèque paginée et originaux. Le coordinateur associe chemins relatifs exacts, identités commerciales, primary/gallery, ordre et alt FR/EN/AR. Les variantes utilisent `variants_json` et son `media_asset_reference` natif ; le manifeste dédié est primary/gallery uniquement.
- **Lots & preuves** : lots persistants propres à l’opérateur, recherche paginée des lots, contrôle de version, préflight natif, erreurs de ligne, export du rapport, exécution séquentielle par vingt lignes et reprise des lignes non appliquées. Un lot de catégories utilise le même coordinateur, avec parents avant enfants et locales distinctes.

## Doctrine conservée

Le schéma atomique détermine les champs métier. Le type commercial détermine conversion et exécution. Les catégories restent des liaisons natives ; un ajout conserve les autres liens. Le storefront et Studio déterminent la présentation et l’exposition publique. Aucune de ces dimensions ne remplace les autres.

Le coordinateur crée ou actualise des **brouillons**. La publication continue de passer par les gates natifs Product 360 ; elle n’est pas déclenchée par l’import. Une offre publiée mise à jour par ce parcours doit être revue puis republiée explicitement. Les importeurs historiques sans `_population_contract=r1` conservent leur chemin natif ; le pont complet s’active sur le contrat R1.

En update/upsert, les champs facultatifs vides reprennent les valeurs existantes. Les catégories déjà liées sont conservées, y compris leurs IDs de locale. `_clear_fields` désigne les effacements explicites, clés séparées par `|`. Les effacements d’un champ requis sont refusés par la validation native. Les JSON restent des JSON ; les listes natives utilisent `|`.

## Population d’un périmètre

1. Cliquer une catégorie ou sous-catégorie. L’arbre affiche le nombre direct et le nombre distinct avec descendants.
2. Ouvrir l’atelier du schéma métier correspondant, ou télécharger son contrat complet. Le schéma actif persistant reste requis pour importer ; un schéma source de secours reste consultable et exportable.
3. Remplir les colonnes FR/EN/AR et métier. Choisir create, update ou upsert ; le mode trilingue exige nom, descriptions courte/complète et SEO dans chaque langue.
4. Préparer le manifeste média. `file_path` reprend exactement le chemin du dossier sélectionné, y compris son premier dossier. Le même basename dans deux dossiers ne suffit pas à créer une correspondance. Un asset existant peut être réutilisé par `asset_key`.
5. Créer le lot. Téléverser explicitement les médias via le Media Vault existant. SHA-256, type/taille, statut actif et révision sont vérifiés. Une session expirée est renouvelée pour le même asset encore pending ; un asset actif d’empreinte différente n’est pas remplacé.
6. Lancer le préflight, corriger ses erreurs, confirmer puis appliquer. Les médias déjà associés et vérifiés ne sont pas téléversés à nouveau lors de la reprise. Après rechargement, les fichiers locaux non envoyés doivent être resélectionnés avec la même empreinte.
7. Revoir le dossier natif avant publication. Les liaisons de catégories ne prouvent pas à elles seules que l’offre apparaît publiquement : état, disponibilité, territoire, catégorie publiée, compatibilité et priorité Studio restent applicables.

## Catégories et sous-catégories

Le template d’architecture utilise `category_key` et `parent_key`, des titres/slugs/descriptions/SEO distincts FR/EN/AR, image de couverture, ordre, thème et types commerciaux permis. Le préflight bloque doublons, cycles, parent absent et identité ambiguë. Les nouvelles catégories restent draft/hidden ; les updates conservent leur état public. Les mutations ont leurs preuves et s’exécutent par vingt enregistrements.

Les affectations d’offres disposent de trois intentions explicites : **ajouter**, **retirer**, **remplacer**. Chaque offre est traitée dans une transaction avec son `updated_at` attendu. Le résultat est par offre : il n’est pas présenté comme une transaction unique de toute la sélection.

## Reprise et limites opérationnelles

Une fermeture normale arrête les prochains blocs ; le bloc serveur courant peut terminer et son état persiste. Relire l’état avant de poursuivre. Un échec partiel conserve les preuves appliquées ; le préflight d’offres exclut les lignes déjà réussies. Pour une source corrigée, créer un nouveau lot avec seulement les références à corriger et réutiliser les assets actifs.

Une mort de processus pendant une écriture peut laisser un lot `running` ou un job natif `importing`. R1 ne réinitialise pas automatiquement une exécution incertaine. Inspecter le job et les objets appliqués avant reprise ; ne pas réexécuter aveuglément. Le rollback de l’installer restaure le **code seulement** ; il ne révoque aucun import ni SQL. Le rollback des données reste l’autorité native des imports et demande une revue des éventuelles modifications postérieures. Les lots de catégories ne disposent pas d’un bouton d’annulation automatique de données.

## Permissions

Lecture : `marketplace.catalog.view`. Schémas : schema.view ou category_native_import.view. Lots d’offres : import.view ; écriture : import.manage. Taxonomie : categories.manage. Affectations : catalog.manage + categories.manage. Médias : media.view/manage. Export visible : catalog.export. Les lots sont liés à leur opérateur ; les offres/catégories respectent le scope territorial existant. Aucun nouveau rôle ni droit n’est attribué par l’installer.

## Vérification réelle

Contrats, permissions et rendu React ont été testés hors ligne sur fixtures. Ces contrôles ne sont ni un typecheck TypeScript ni une preuve de fonctionnement en production. Le navigateur Chromium n’est pas disponible dans cet environnement ; l’aperçu interactif livré utilise les vrais composants avec des données fictives et bloque toute écriture.

Avant acceptation : appliquer puis vérifier le SQL dans l’éditeur Marketplace ; construire l’image distante ; tester la navigation admin et les permissions ; effectuer un petit lot pilote avec le Media Vault réel ; vérifier ses brouillons et la conservation des catégories/langues ; contrôler séparément la publication native et l’exposition publique. Aucun changement Windows ou nouvelle variable n’est requis par ce patch ; il réutilise le stockage média configuré.
