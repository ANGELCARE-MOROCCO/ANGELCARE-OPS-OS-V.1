# Activation fournisseurs — séparée de l’installer

Le code est complet ; les trois apps fournisseur, leurs identifiants/secrets et l’accès à votre configuration Auth n’ont pas été fournis ici. Aucun fournisseur n’est donc déclaré activé ou testé en production par ce paquet.

## Deux URLs à ne pas confondre

| Où | Valeur pour l’environnement connu |
|---|---|
| Callback enregistré chez Google, Meta et Apple | https://angelcare-supabase.duckdns.org/auth/v1/callback |
| Retour Supabase vers le site client | https://my.angelcarehub.com/angelcare-marketplace/auth/social/callback |

Ces valeurs viennent du contexte déployé connu. Si NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SITE_URL ont changé depuis, utiliser leurs valeurs réelles, pas une seconde instance. L’API de readiness de la nouvelle version vérifie les settings de l’instance consommée par l’app.

## Supabase Auth auto-hébergé

Configurer les providers dans le **service Supabase Auth** qui sert le Marketplace ; aucune secret fournisseur en NEXT_PUBLIC ni dans l’environnement public du navigateur. Ajouter à GOTRUE_URI_ALLOW_LIST l’entrée étroite suivante pour le nonce, en conservant toutes les entrées existantes :

```text
https://my.angelcarehub.com/angelcare-marketplace/auth/social/callback?nonce=*
```

Ne pas remplacer toute la liste : les anciennes URLs d’inscription, récupération et OPS doivent rester autorisées. Vérifier que API_EXTERNAL_URL pointe déjà vers la bonne origine Supabase Auth. La version et le mode de configuration réellement installés doivent être respectés ; ne pas appliquer à l’aveugle un nouveau fichier de service.

Les noms de configuration GoTrue usuels sont :

```dotenv
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<votre client web Google>
GOTRUE_EXTERNAL_GOOGLE_SECRET=<votre secret Google>
GOTRUE_EXTERNAL_FACEBOOK_ENABLED=true
GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID=<votre app ID Meta>
GOTRUE_EXTERNAL_FACEBOOK_SECRET=<votre app secret Meta>
GOTRUE_EXTERNAL_APPLE_ENABLED=true
GOTRUE_EXTERNAL_APPLE_CLIENT_ID=<votre Services ID web Apple>
GOTRUE_EXTERNAL_APPLE_SECRET=<votre JWT client secret Apple valide>
```

Ces valeurs sont des emplacements à remplir, pas des credentials générés ou prêts. Garder la configuration SMTP et les Auth hooks en place. Redémarrage Auth, modification de service et activation sont des étapes séparées, non effectuées par l’installer.

## Google

Créer/configurer le client OAuth Web avec domaine et branding AngelCare ; ajouter l’origine du site et le callback Supabase ci-dessus. Configurer openid, email et profil selon la documentation Supabase. Autoriser la population cible et terminer les exigences de publication/validation de l’app. Ne pas confondre comptes de test et accès grand public.

## Facebook / Meta

Configurer Facebook Login et le callback Supabase HTTPS exact. Autorisations public_profile et email requises ; l’app doit pouvoir servir les clients visés, pas seulement ses administrateurs/testeurs. Fournir les pages de confidentialité et le parcours de suppression des données requis par votre app Meta. Le code demande seulement email en plus du profil natif.

## Apple

Configurer App ID, Services ID web, domaine Supabase et return URL. Générer le client secret signé à partir de vos Team ID/Key ID et clé .p8 ; seul le secret nécessaire va dans Auth. Le Services ID doit être le premier client ID pour ce flux web. Le secret OAuth est à renouveler au plus tard à son expiration, Apple autorisant une validité maximale de six mois. Le formulaire recueille le nom sans dépendre d’une livraison du nom par Apple. Si vous utilisez les emails relais Apple, configurer également les domaines/adresses d’envoi autorisés dans Apple Private Email Relay pour les communications nécessaires.

## Acceptation réelle

Tester chaque fournisseur avec un compte client neuf puis existant. Un nouveau compte doit passer par le formulaire ; le registre admin doit montrer les coordonnées validées ; un compte déjà enregistré ne doit pas être doublonné ; le retour doit rester dans le parcours client. Les boutons disponibles indiquent la configuration, pas une certification de login réel. Aucun test fournisseur n’a été exécuté ici.

Sources officielles consultées :
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-facebook
- https://supabase.com/docs/guides/auth/social-login/auth-apple
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/redirect-urls
