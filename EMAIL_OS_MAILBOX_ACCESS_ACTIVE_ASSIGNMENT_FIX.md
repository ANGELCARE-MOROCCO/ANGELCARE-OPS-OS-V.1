# Email-OS mailbox access active-assignment fix

## Root cause
`verifyMailboxPin()` filtered `email_os_mailbox_user_assignments` by `status = active`, but `getAssignmentContext()` did not. If the same user/mailbox had one active assignment plus an older revoked/historical assignment, Supabase `maybeSingle()` received multiple rows, returned an error, and the code converted that into `null`. The mailbox page then redirected to the gate with “Mailbox not assigned to this user.”

## Fix
Add `.eq('status', 'active')` to `getAssignmentContext()` so mailbox-entry authorization resolves the same active assignment already accepted by the unlock endpoint.
