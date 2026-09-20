# AngelCare Marketplace Studio — P06 Certification

- Phase: P06 Dynamic Content Source Engine
- Sources dynamiques P01 couvertes: 12/12
- Stratégies: 11
- Politiques source vide: 3
- API ciblées: 2
- Runtime Studio/CMS public: OUI
- P08 bascule template Category-Native assigné: NON
- Données métier persistées dans Studio: NON
- SQL / migration / changement de schéma: NON
- Build local: NON
- TypeScript global: NON

## Autorités

P01 reste l’autorité de découverte. P02 reste l’autorité de sélection canonique. P03 reste l’autorité des actions structurées. P05 fournit le modèle de matérialisation sur clone runtime. P06 persiste uniquement des recettes bornées et résout les données à la demande.

## Stratégies certifiées

- source_query
- catalog_published
- catalog_featured
- catalog_available
- catalog_newest
- merchandising_popular
- merchandising_best_pick
- merchandising_new_arrival
- category_items
- collection_items
- experience_schema_items

## Doctrine

Aucune table métier parallèle, aucune copie durable de prix/disponibilité/produit/collection/campagne/preuve dans le document Studio. Les sources non publiques ou invalides échouent de manière contrôlée. Les pages Category-Native conservent leur renderer existant jusqu’à P08.
