# API Route Register — Category-Native MZ1

| Route | Methods | Purpose |
|---|---|---|
| `/api/angelcare-marketplace/admin/category-native/summary` | GET | Command data and coverage |
| `/api/angelcare-marketplace/admin/category-native/schemas` | GET, POST | List/create schemas |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]` | GET, PATCH | Read/update one schema |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/[action]` | POST | Publish, pause, duplicate, restore |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields` | GET, POST | List/create fields |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields/[fieldId]` | PATCH | Update field behavior |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/fields/reorder` | POST | Reorder studio fields |
| `/api/angelcare-marketplace/admin/category-native/schemas/[schemaKey]/template` | GET | Download CSV or JSON guide |
| `/api/angelcare-marketplace/admin/category-native/imports` | GET, POST | List jobs / dry-run upload |
| `/api/angelcare-marketplace/admin/category-native/imports/[jobId]` | GET | Detailed rows and results |
| `/api/angelcare-marketplace/admin/category-native/imports/[jobId]/[action]` | POST | Execute or rollback |
| `/api/angelcare-marketplace/admin/category-native/homepage-blocks` | GET | Category-aware block library |

All routes require Marketplace permissions and use server-side Supabase authority. Dynamic routes use the Next.js `{ params: Promise<...> }` context contract.
