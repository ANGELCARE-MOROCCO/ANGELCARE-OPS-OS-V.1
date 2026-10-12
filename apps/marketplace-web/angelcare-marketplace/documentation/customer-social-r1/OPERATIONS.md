# Customer Social Sign-in R1

## Contrat

Entrées Google, Facebook et Apple exclusivement sur les pages clients login/register. Le mot de passe, la récupération email, le magic link et les routes Auth existantes restent disponibles. Aucun bouton social n’est ajouté au backoffice, aux espaces prestataires ou formateurs. L’activation du fournisseur dans Supabase reste un réglage de l’instance Auth commune ; elle ne crée aucun rôle ou droit admin dans l’app.

L’identité OAuth est vérifiée par Supabase via le client SSR existant et PKCE. Le callback est propre au parcours clients, lié à un cookie HttpOnly de dix minutes et à un nonce. Le code est échangé puis l’utilisateur est relu depuis Auth. Les destinations sont limitées par customerReturnTo aux pages publiques/clients du Marketplace ; aucun returnTo admin ou externe n’est accepté.

Nouveau client : pas de dossier Marketplace et pas de contexte client avant complétion du formulaire. Nom complet, téléphone de contact, type family/organization et accord explicite sont requis. Email fourni par l’identité confirmée et non modifiable dans ce formulaire ; pas de nouveau mot de passe imposé. Les changements d’adresse passent par les parcours de sécurité existants. Un téléphone de contact n’est pas une preuve de vérification SMS. Aucun consentement marketing n’est ajouté.

Après complétion, une transaction PostgreSQL valide l’Auth user et son identité fournisseur, verrouille cet Auth ID, crée le dossier natif et la preuve de consentement. Elle n’altère pas auth.users, ne fusionne pas les utilisateurs par email et ne réactive pas un compte suspendu/fermé. Le nouveau profil devient visible dans les registres clients existants via angelcare_marketplace_customer_accounts : nom, email, téléphone, type, référence et statut. Les liens Family et le rattachement invité sont réalisés par les fonctions natives existantes. L’organisation ne reçoit pas automatiquement un tenant ou des droits B2B.

Client déjà enregistré : le dossier reste l’autorité ; aucun nom, téléphone, type, statut premium ou consentement existant n’est remplacé par la complétion sociale. Supabase demeure l’autorité de liaison des identités vérifiées ; aucun merge artisanal par adresse email. La table social_profiles conserve la preuve d’onboarding des nouveaux dossiers ; provider identifie une identité autorisée associée au compte, pas un historique complet des connexions.

Les indices publics Auth (nom, téléphone, locale, type client) sont synchronisés au mieux depuis le dossier canonique pour les parcours email/localisation existants. Ces métadonnées éditables ne décident jamais de la complétion ou des droits. Une interruption de cette synchronisation ne supprime pas le dossier natif déjà enregistré.

## Routes

| Route | Rôle |
|---|---|
| /api/angelcare-marketplace/customer/auth/social/providers | Disponibilité depuis settings Auth et présence de la migration |
| /api/angelcare-marketplace/customer/auth/social/start | POST même origine, liste de trois fournisseurs, début PKCE |
| /angelcare-marketplace/auth/social/callback | Callback GET dédié, contrôle nonce/code/identité |
| /angelcare-marketplace/{locale}/auth/complete-profile | Formulaire FR/EN/AR dans le shell d’accès client |
| /api/angelcare-marketplace/customer/auth/social/profile | GET projection propre au client, POST complétion native |

Les boutons sont désactivés tant que settings Auth n’annonce pas le provider actif et que le marker SQL n’est pas présent. Un flag actif ne prouve pas la validité de la clé fournisseur : les login réels restent les tests d’acceptation. Les secrets Google/Meta/Apple ne sont pas placés dans le navigateur, ni dans ces sources.

## SQL séparé

customer-social-r1.sql crée la preuve d’onboarding, la complétion transactionnelle et la lecture de readiness. RLS sans policy publique ; anon/authenticated n’ont pas accès à la table et aux RPC. Service role uniquement, après résolution de l’utilisateur côté serveur. Une contrainte unique est ajoutée à Auth ID sur les comptes natifs. Si des doublons historiques existent, la transaction s’arrête sans les effacer ou les fusionner. Le SQL n’a pas été exécuté sur votre DB ici.

La migration conserve les dossiers et données existants. Les nouvelles créations se font seulement après les vrais POST clients validés. Le rollback de code ne supprime ni la migration ni des comptes créés. Désactiver les providers n’efface pas les clients ; leur méthode de connexion suivante doit rester maîtrisée dans Auth.

## Fournisseurs et release

Voir PROVIDERS.md : deux callbacks distincts, configurations dans l’instance Supabase Auth, clés propres à Google/Meta/Apple et append de la liste de redirects. Aucune modification SMTP, Mail OS, Windows, pin admin, token LiveKit ou variable de l’app n’est nécessaire pour ce code. L’app réutilise sa configuration Supabase et son public origin existants.

Installer, appliquer/vérifier le SQL séparément, configurer les providers avec vos propres identifiants, puis commit/push et build distant Marketplace selon votre SOP. Aucun build local ou global TypeScript n’a été lancé.

## Vérifications

48 contrôles de contrats/handlers sur mocks Auth/DB/cookies, 15 rendus React serveur avec états contrôlés FR/EN/AR. Les tests d’installation/rollback sont dans verification/installer-results.json. Ces contrôles ne sont pas des login réels, une exécution PostgreSQL, un typecheck ou une acceptation visuelle navigateur.

Le PREVIEW.html montre les vrais composants, des données de démonstration, des liens neutralisés et aucun parcours OAuth actif. La photographie native du shell n’était pas incluse dans la capture source ; elle est indiquée comme absente dans l’aperçu, sans remplacement installé dans le dépôt.

Acceptance : Google/Meta/Apple en conditions de production, nouveau profil sans dossier avant complétion, champs/admin après création, reprise après rafraîchissement, client existant sans doublon, retour au panier/parcours, compte suspendu/fermé bloqué, annulation fournisseur, expiration PKCE, consentement et mobile/RTL. Vérifier aussi les parcours email et récupération existants. Facebook doit fournir un email ; Apple peut utiliser une adresse relais qu’on conserve telle que vérifiée, sans fusion avec une autre adresse.
