# Customer Email Premium R1

## Livré

29 modèles, FR/EN/AR et RTL, huit familles visuelles : compte, sécurité, commerce, accompagnement, Academy, B2B, finance et assistance. Tableaux de présentation, styles essentiels inline, version texte, preheader, bouton principal, lien de secours, référence et sections conditionnelles. Logo officiel couleur en tête et logo officiel blanc en pied sombre. Les assets existants `/brand/angelcare-pearl-rim-colour-r1.png` et `white-r1.png` sont réutilisés, pas redessinés.

### Déjà raccordés à l’automatisation native

Inscription/confirmation, récupération de mot de passe, connexion personnelle, invitation, changement d’adresse, code de réauthentification et notifications de sécurité. Le composeur Auth existant sélectionne le nouveau rendu uniquement pour le sender client `supports@angelcarehub.ma`. Les contexts OPS et leur sender natif conservent exactement leur présentation antérieure. Worker, scheduler, ledger, SMTP, passerelle Windows, credentials, tokens, destinataires et callbacks ne sont pas modifiés.

Après déploiement de la nouvelle image, les nouveaux jobs clients rendus par ce worker utilisent ce design. Ce patch ne réexpédie pas d’anciens messages et ne garantit pas leur arrivée en inbox. Le hook et le worker doivent déjà être actifs selon leur configuration existante.

### 22 modèles de cycle client prêts, sans dispatcher ajouté

Le code disponible expose des notifications Journey et un endpoint d’enquiries, mais aucun dispatcher email transactionnel complet raccordé à ces événements n’a été identifié dans le périmètre source inspecté. Nous ne simulons donc pas leurs envois. `composeCustomerEmail(event, context)` est un composeur pur, prêt à fournir `{subject, html, text, event, locale}` à l’autorité d’envoi existante, après réception de l’événement natif réel.

Ces modèles sont : bienvenue après vérification ; commande reçue, préparation, expédition, livraison ; demande d’accompagnement reçue, rendez-vous confirmé, modification validée, annulation ; récurrence reçue, planning publié ; inscription Academy reçue et confirmée ; projet B2B reçu, proposition publiée ; règlement en attente et confirmé, remboursement traité, crédit portefeuille ; assistance reçue, réponse publiée et clôture.

Installer ces modèles ne déclenche pas les 22 automatisations. Leur activation nécessite le raccordement aux événements persistés et à une autorité d’envoi avec propriété du destinataire, idempotence et suivi de delivery. Aucun nouvel event listener, cron, queue, SQL ou envoi de production n’est créé par ce patch de présentation.

## Contrat d’intégration

```ts
import {composeCustomerEmail} from '@/angelcare-marketplace/customer-commerce/customer-email-design/catalog'

// Les valeurs doivent provenir d’un événement persisté et de sa projection publique.
const message = composeCustomerEmail('order_received', {
  locale: 'fr', origin: configuredMarketplaceOrigin,
  state: canonicalReceiptState, reference: canonicalPublicReference,
  name: publicCustomerName, items: publicOrderItems,
})
// Passer message.subject/html/text à l’autorité existante seulement après contrôle
// destinataire/propriété, consentement applicable et clé d’idempotence de l’événement.
```

Le composeur ne reçoit pas de mot de passe, PIN, credential SMTP, notes internes ou objet DB brut. `origin` vient de la configuration serveur, jamais d’un formulaire non vérifié. `details`, `items` et `customerReply` sont une projection explicitement autorisée pour le client. `evidenceReference` est un marqueur obligatoire pour les messages engageants ; le composeur ne lit pas la DB et ne prouve pas lui-même l’existence de cette référence. L’intégrateur doit la résoudre dans l’autorité native.

Le champ `state` exprime l’événement vérifié et mappé par l’intégrateur. Les états acceptés des modèles ne remplacent pas les enums de vos tables natives. Voir MAPPING.json pour le contrat complet. `journeyId` optionnel construit une URL de parcours client ; sinon les pages account existantes sont utilisées. Le login, l’ownership et la récupération des commandes guest restent les contrôles existants.

Règlement en attente ne devient pas payé ; demande d’accompagnement ne devient pas rendez-vous confirmé ; annulation ne devient pas remboursement. Les montants nuls sont affichés, les montants absents ne sont pas inventés. Paiement confirmé, remboursement traité et crédit portefeuille exigent état compatible, référence de preuve et montant/currency explicites. Un rendez-vous confirmé exige en plus date/heure avec offset et timezone nommée. Une réponse d’assistance exige un texte publié destiné au client. Aucun délai de réponse, crédit bancaire immédiat, stock, promotion ou certification n’est fabriqué.

## Prévisualisation

Ouvrir `previews/PREVIEW.html` après extraction. Sélecteur de 29 messages, FR/EN/AR, largeur desktop/mobile 390 px, versions texte. 87 HTML issus des vrais composeurs, avec données de démonstration clairement annoncées. Les liens sont neutralisés et les logos sont locaux. Aucun email, API ou lien Auth réel n’est déclenché par l’aperçu. Les codes et références sont des fixtures, jamais des secrets de production.

## Tests séparés, facultatifs

Node 24 est requis par ces scripts de lecture directe TS. Ils résolvent uniquement les modules relatifs du renderer et n’invoquent pas tsc.

```bash
node "$HOME/Desktop/angelcare-platform/apps/marketplace-web/scripts/customer-email-design/verify-offline.mjs"
node "$HOME/Desktop/angelcare-platform/apps/marketplace-web/scripts/customer-auth-email/offline-checks.mjs"
```

Résultats de préparation : 112 checks comportement/contrats, 87 renders en FR/EN/AR ; régression Auth existante 48/48 ; contrôles collection exécutables Node 70/70. Ces suites se recouvrent et ne sont pas comptées comme des centaines de cas distincts. Les 87 aperçus sont parsés avec vérification des assets et liens neutralisés. Aucun build, tsc, SQL ou envoi réel n’est effectué.

Un aperçu HTML local n’est pas une preuve de rendu Gmail/Outlook/Apple Mail. Le rendu de ces clients, les logos à distance avec images autorisées/bloquées et une réception réelle doivent être vérifiés après déploiement. Des variations de coins arrondis/dark mode peuvent dépendre du client. Aucune garantie d’arrivée inbox n’est revendiquée.

## Installation et release

L’installer préflighte toutes les fusions, conserve les modifications compatibles, refuse les conflits, sauvegarde les vrais fichiers et vérifie leurs empreintes. Il ne ferme pas le terminal. Le rollback exact affiché préserve les modifications ultérieures et ne touche ni la DB, ni le worker déployé, ni les credentials.

Prérequis : patch Auth Email Native R1 déjà installé et assets de marque présents. Après installation, commit/push et build distant via le workflow Marketplace existant, puis déploiement Coolify. Aucun changement Windows ou variable n’est requis. L’activation des 22 événements transactionnels n’est pas incluse dans ce paquet de modèles.
