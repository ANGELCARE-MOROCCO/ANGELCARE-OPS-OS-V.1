# ANGELCARE BUILD 360 — Mega ZIP 02

**Contract:** Territory OS Core & Global Expansion Layer  
**Build root:** `apps/ops-web/angelcare-marketplace`  
**Cumulative baseline:** Mega ZIP 01  
**Execution boundary:** No build, Git action, deployment or database migration is performed by the delivery package.

## Territory lifecycle

| Current | Permitted target | Rule |
|---|---|---|
| draft | configuring | Identity accepted |
| configuring | review | Configuration submitted |
| review | configuring | Correction requested |
| review | soft_launch | Reduced mandatory gate set passed |
| review | live | All mandatory blocking gates passed |
| soft_launch | configuring/live/paused | Governed decision |
| live | paused | Data preserved, health becomes paused |
| paused | soft_launch/live/archived | Resume validation or archive authority |
| archived | none | Historical terminal state |

Invalid transitions return `INVALID_STATE_TRANSITION`. Live and soft-launch transitions are checked server-side against calculated readiness.
