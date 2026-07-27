$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $Root "scripts/apply_ac_capital_os_mz1.mjs")
node (Join-Path $Root "scripts/verify_ac_capital_os_mz1.mjs")
