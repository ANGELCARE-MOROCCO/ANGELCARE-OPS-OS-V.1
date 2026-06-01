# Wire This Now

## 1. Import in `components/email-os-core/EmailOSWorkspacePro.tsx`

```tsx
import EnterpriseComposeModal from "@/components/email-os-core/EnterpriseComposeModal"
import InboxActionToolbar from "@/components/email-os-core/InboxActionToolbar"
import { useEmailOSActionEngine } from "@/hooks/useEmailOSActionEngine"
```

## 2. Add state inside component

```tsx
const [composeOpen, setComposeOpen] = useState(false)
const [composeMode, setComposeMode] = useState<"compose" | "reply" | "schedule">("compose")
const { busyAction, mutateMessage } = useEmailOSActionEngine(inboxRows, setInboxRows)
```

## 3. Compose menu actions

Compose email:

```tsx
setComposeMode("compose")
setComposeOpen(true)
```

Schedule email:

```tsx
setComposeMode("schedule")
setComposeOpen(true)
```

Reply:

```tsx
setComposeMode("reply")
setComposeOpen(true)
```

## 4. Replace static toolbar icons

```tsx
<InboxActionToolbar
  selectedId={selected?.id}
  busy={Boolean(busyAction)}
  onAction={(action) => {
    if (action === "schedule") {
      setComposeMode("schedule")
      setComposeOpen(true)
      return
    }

    selected?.id && mutateMessage(selected.id, action, { mailboxId: selected.mailbox_id })
  }}
/>
```

## 5. Render modal near bottom of the return

```tsx
<EnterpriseComposeModal
  open={composeOpen}
  mode={composeMode}
  mailboxes={mailboxes}
  selectedEmail={selected}
  onClose={() => setComposeOpen(false)}
  onDone={load}
/>
```
