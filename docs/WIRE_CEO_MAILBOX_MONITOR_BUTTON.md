# Wire CEO Mailbox Monitor Button

Import in your Email-OS settings/sidebar component:

```tsx
import CEOSettingsMailboxMonitorButton from "@/components/email-os-core/CEOSettingsMailboxMonitorButton"
```

Render inside the Email-OS settings/sidebar menu:

```tsx
<CEOSettingsMailboxMonitorButton user={user} />
```

`user` should be your authenticated app profile object.

Accepted CEO role values:
ceo, owner, founder, super_admin, superadmin, admin_ceo

Production API guard:
```env
EMAIL_OS_CEO_EMAILS=your-ceo-email@domain.com
EMAIL_OS_REQUIRE_CEO_GUARD=true
```

New page:
```txt
/email-os/mailbox-liveness
```

Validate:
```bash
node scripts/verify-email-os-ceo-mailbox-liveness.mjs
rm -rf .next
npm run build
```
