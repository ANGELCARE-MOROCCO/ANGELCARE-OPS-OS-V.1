# Installation

Run the MZ07 surgical installer from the monorepo parent path. It verifies MZ06, creates an exact-file timestamped backup, copies only manifest-authorized files, patches package scripts without deleting existing scripts, runs cumulative static checks and prints rollback instructions.

The installer does not apply SQL, stage Git, commit Git or run a production build.

Apply the 34 MB migration using `psql`, not the dashboard SQL editor, then run `phase-07/VERIFY.sql`.
