# MZ1 Meta Integration Matrix

| Capability | Adapter |
|---|---|
| OAuth | Facebook Login for Business configuration ID |
| Managed Page discovery | `/me/accounts` |
| Linked Instagram discovery | `instagram_business_account` |
| Instagram image | container -> publish |
| Instagram carousel | child containers -> parent -> publish |
| Instagram Reel | REELS container -> processing -> publish |
| Instagram Story | STORIES container -> processing -> publish |
| Facebook text/image | Page feed/photos |
| Facebook multi-image | unpublished photos -> attached media feed |
| Facebook Reel | Page Reel start -> hosted upload -> finish -> status confirmation |
| Facebook Page Story | intentionally unsupported in MZ1 verified adapter |

Required environment values are listed in `SOCIAL_COMMAND_MZ1_ENVIRONMENT.md`. Tokens from Graph API Explorer testing must never be copied into production variables.
