# MZ15 Installation and Rollback

The installer backs up every overwritten file under `.angelcare_backups/ac-capital-os-mz15-final-<timestamp>/` before copying MZ15 files.

The SQL is not executed automatically. If MZ15 has not been committed and rollback is required, restore backed-up files or reset only the MZ15-touched paths through the repository's controlled Git workflow. Do not drop MZ15 tables casually after SQL execution; disable the UI routes or revert application files first, then approve a database rollback separately.
