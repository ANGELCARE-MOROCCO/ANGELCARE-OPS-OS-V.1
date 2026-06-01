# Fix: 535 5.7.0 authentication failed

The app now finds mailbox credentials, but Menara rejects the username/password.

Open:

```txt
/api/email-os/auth-diagnostics
```

It tests every mailbox SMTP login and shows exactly which mailbox fails.

Most common fixes:
- Restart dev server after `.env.local` changes.
- Use lowercase email usernames:
  - commercial@angelcare.ma
  - academy@angelcare.ma
  - homeservice@angelcare.ma
- Keep passwords exactly as Menara gave them.
- Ask Menara to confirm SMTP is enabled for the failing mailbox.
