# Atomic Neutral R4 — quatre compositions natives

## Ce qui change

Quatre compositions distinctes et éditables : Produit (exploration et choix), Service (périmètre et préparation), Academy (programme et session), B2B (contexte organisationnel et brief). Les contenus sont neutres : aucun produit de démonstration n’est installé dans le catalogue. Les 31 schémas actuels sont associés à leur domaine dans les packs ; les champs publics supplémentaires restent accessibles dans l’explorateur complet.

Les sections, leurs titres et les ancres disparaissent lorsque leur source métier est vide. Zéro et faux sont des valeurs renseignées. Les pictogrammes de caractéristiques et badges ne sont émis que pour des champs présents et reconnaissables. Les listes informatives ne deviennent pas automatiquement des choix. Les options et contraintes natives restent les autorités : les outils ne constituent ni devis validé, ni réservation de capacité, ni confirmation de disponibilité.

## Médias et accompagnement

Images d’offres entièrement visibles avec object-fit: contain. Vidéo et audio disposent de lecteurs ; les documents s’ouvrent par lien. L’absence de média d’offre ne crée pas de photographie fictive. Quatre photographies éditoriales exclusives illustrent le bandeau de conseil, séparé du produit/service/cours/solution. Elles ne représentent pas des salariés, prestataires, établissements ou preuves clients identifiés. Le bandeau peut rester visible sans données métier ; il est éditable et désactivable dans Studio.

Le formulaire de conseil utilise `/api/angelcare-marketplace/public/inquiries`, sans nouvel inbox. Contact et consentement requis, double soumission verrouillée, saisies conservées après erreur. Le succès exige la référence publique renvoyée par l’autorité existante. Aucun délai de réponse ou appel immédiat n’est promis.

## Projection et transactions

Les métadonnées facultatives inputType/options/required proviennent uniquement des champs déjà public_visible. Aucun champ privé n’est ajouté. Les calendriers sont des intentions préparatoires, pas un inventaire live ; les cohortes doivent être réellement ouvertes et éligibles. Le panier, les parcours configuration/booking/enrollment/quotation et leurs validations existantes demeurent utilisés. Pas de nouvelle règle de paiement, de disponibilité ou de publication.

## Activation Studio — à faire explicitement

Installer le code actualise le renderer Atomic v1 : styles, contrôles conditionnels, explorateurs et conseil. Les compositions persistées conservent leur ordre et leur affectation. `neutralExperienceRevision=0` permet de revenir à la présentation antérieure ; `showDefaultAssistance=false` désactive le conseil automatique. Les racines historiques v0 et les autres fallbacks ne sont pas remplacés arbitrairement.

Pour obtenir les quatre nouvelles compositions exactes, importer les quatre `.world.json` via l’import de packages World Factory existant dans Studio / Public Experience Authority, vérifier le master domain, affecter le monde au domaine ou au périmètre voulu, puis revoir et publier. Importer n’est pas publier. L’installer ne force ni SQL, ni affectation, ni priorité sur une composition Studio publiée.

| Pack | Master domain | Intention |
|---|---|---|
| product.world.json | b2c_product_digital | Choix produit et panier/commande natifs |
| service.world.json | b2c_service_family | Préparation du besoin et configuration native |
| academy.world.json | academy_admission | Programme, cohorte et inscription native |
| b2b.world.json | b2b_institutional | Contexte organisationnel et proposition native |

La route de détail, le header/menu et le footer communs viennent du shell existant déjà corrigé dans R3. Le patch conserve cette intégration ; il ne réécrit pas leurs logos, navigation ou code. Un thème d’un autre moteur reste sous son autorité et ne devient pas automatiquement une composition R4.

## Aperçu et preuves

`previews/PREVIEW.html` contient les vrais composants React et leurs interactions, avec fixtures identifiées. Il est autonome, ouvre les quatre domaines et FR/EN/AR, permet les états sans données et le chargement local d’une projection PublicExperience360 JSON. Les soumissions et API de production sont bloquées. Les quatre HTML statiques offrent un rendu serveur. Leur shell est représentatif pour contexte, pas un screenshot du header/footer déployé.

81 contrôles source/comportement/visibilité, 24 rendus React serveur réels, 8 contrôles du formulaire, intégrité des quatre packages et 100% des actions requises compilées. La compilation World Factory READY est structurelle. strictVisualFidelity est false, PIXEL_COMPARISON_PENDING est explicite et visual coverage vaut 0 : ce n’est pas une certification pixel. Le navigateur n’était pas disponible ici ; aucune acceptation visuelle navigateur n’est revendiquée. Pas de typecheck TypeScript, build d’app/image, requête de production, SQL ou test d’envoi email réalisé pour ce patch.

## Installation et rollback

L’installer vérifie le paquet puis prépare toutes les fusions avant écriture. Il conserve les modifications compatibles, refuse les chevauchements ambigus et toute collision sur un nouveau fichier. Sauvegarde des fichiers réels, contrôle des empreintes et rollback exact affiché. Réinstallation idempotente. Le rollback refuse les changements postérieurs avant toute écriture ; il restaure le code, pas des affectations Studio ou un déploiement.

## Acceptation après release

Construire l’image Marketplace distante puis vérifier sur les routes réelles les quatre domaines, FR/EN/AR, mobile/RTL, contenus riches et incomplets, média image/vidéo/document, choix persistés vers le configurateur, panier et cohortes, formulaire de conseil et référence réellement reçue en admin. Contrôler la composition Studio effectivement sélectionnée, le shell commun et la lisibilité visuelle desktop/mobile. Ne pas confondre une intention préparée avec une transaction validée.
