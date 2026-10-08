# Canonical Marketplace Admin tree

The frozen human-facing workspaces are:

1. Accueil
2. Commandes & réservations
3. Produits & services
4. Catégories & collections
5. Clients
6. Boutique
7. Marketing & promotions
8. Opérations
9. Prestataires & fournisseurs
10. Academy
11. B2B & partenaires
12. Finance
13. Trust & qualité
14. Analytics & intelligence
15. Paramètres & gouvernance

Primary route authority:

| Workspace | Canonical route | Contextual authority examples |
| --- | --- | --- |
| Accueil | `/angelcare-marketplace/admin` | global command/search and recent-object shell |
| Commandes & réservations | `/angelcare-marketplace/admin/orders` | bookings, quotes, subscriptions, Conversion |
| Produits & services | `/angelcare-marketplace/admin/catalog/items` | Product 360, pricing, publication, history |
| Catégories & collections | `/angelcare-marketplace/admin/catalog/categories` | collections, category-native studios/imports |
| Clients | `/angelcare-marketplace/admin/customers` | customer/family dossiers, support, health |
| Boutique | `/angelcare-marketplace/admin/boutique` | homepage, pages, media, navigation, footer |
| Marketing & promotions | `/angelcare-marketplace/admin/promotions` | growth, Live Experience, merchandising, discovery |
| Opérations | `/angelcare-marketplace/admin/operations` | missions, journeys, territory, Flight Deck, bulk |
| Prestataires & fournisseurs | `/angelcare-marketplace/admin/supply-network` | providers, vendors, suppliers, capacity |
| Academy | `/angelcare-marketplace/admin/academy` | programs, cohorts, sessions, evidence, certificates |
| B2B & partenaires | `/angelcare-marketplace/admin/verticals` | organizations, Partner OS and four verticals |
| Finance | `/angelcare-marketplace/admin/finance` | payments, invoices, Wallet, price books, reconciliation |
| Trust & qualité | `/angelcare-marketplace/admin/trust` | Quality 360, complaints, CAPA, SOP, sensitive content |
| Analytics & intelligence | `/angelcare-marketplace/admin/analytics` | metrics, data quality, executive control, briefs |
| Paramètres & gouvernance | `/angelcare-marketplace/admin/configuration` | modules, workspaces, security, QA, launch, activation |

`AdminNavigation.tsx` statically contains exactly these fifteen entries. Technical route families remain deep-linkable through workspace commands or `AdminWorkspaceContextNav`; none is a competing primary-sidebar entry. All 542 baseline routes have a final disposition in `ADMIN_ROUTE_DISPOSITION.csv`.
