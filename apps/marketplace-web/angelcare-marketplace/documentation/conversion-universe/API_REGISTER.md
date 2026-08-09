# API register

| Endpoint family | Methods | Responsibility |
|---|---|---|
| `/api/angelcare-marketplace/conversion/sessions` | GET, POST | Create/retrieve visitor-bound session |
| `/sessions/[sessionKey]` | GET, PATCH | Read and progress configuration/identity/status |
| `/price` | POST | Revalidate active price authority or quote requirement |
| `/availability` | POST | Revalidate capacity and create expiring holds |
| `/consent` | POST | Store versioned consent evidence |
| `/confirm` | POST | Idempotent canonical outcome/handover |
| `/basket` | GET, POST | Retrieve/create visitor basket |
| `/basket/[basketId]/items` | POST, DELETE | Govern basket lines |
| `/basket/[basketId]/checkout` | POST | Open checkout from existing basket |
| `/admin/summary`, `/admin/sessions`, `/recover` | GET/POST | Permission-protected Backoffice operations |
