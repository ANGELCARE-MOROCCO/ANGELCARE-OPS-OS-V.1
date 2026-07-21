# Installation

Run the surgical installer from the monorepo parent:

```bash
bash "$HOME/Downloads/apply_revenue_os_mz06.sh"   "/Users/user/Desktop/angelcare-platform"   "$HOME/Downloads/ANGELCARE_REVENUE_COMMAND_OS_MZ06_GOLDEN_300.zip"
```

Then apply the MZ06 migration manually in Supabase SQL Editor.

No installer operation applies a migration, stages Git, commits Git or runs a production build.
