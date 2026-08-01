param(
  [string]$InstallDir = "C:\AngelCare\flashcards-vault-node",
  [string]$StorageRoot = "C:\AngelCare\storage\flashcards-os",
  [string]$NodeId = "flashcards-vault-primary",
  [string]$NodeSecret = "",
  [int]$Port = 4317
)
$ErrorActionPreference = "Stop"
Write-Host "ANGELCARE FLASHCARDS OS — UMZ3 WINDOWS PRODUCT VAULT" -ForegroundColor Cyan
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw "Node.js 20+ is required." }
$major = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($major -lt 20) { throw "Node.js 20+ is required; detected $major." }
if ([string]::IsNullOrWhiteSpace($NodeSecret)) {
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $NodeSecret = [Convert]::ToHexString($bytes).ToLowerInvariant()
}
if ($NodeSecret.Length -lt 32) { throw "NodeSecret must contain at least 32 characters." }
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$backup = "$InstallDir.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path $InstallDir) { Copy-Item $InstallDir $backup -Recurse -Force; Write-Host "Backup: $backup" }
New-Item -ItemType Directory -Force -Path $InstallDir,$StorageRoot | Out-Null
Copy-Item "$source\server.js","$source\package.json" $InstallDir -Force
@"
FLASHCARDS_VAULT_HOST=0.0.0.0
FLASHCARDS_VAULT_PORT=$Port
FLASHCARDS_VAULT_NODE_ID=$NodeId
FLASHCARDS_VAULT_NODE_SECRET=$NodeSecret
FLASHCARDS_VAULT_ROOT=$StorageRoot
FLASHCARDS_VAULT_MAX_CHUNK_BYTES=67108864
FLASHCARDS_VAULT_MAX_FILE_BYTES=32212254720
FLASHCARDS_VAULT_REQUEST_SKEW_MS=300000
"@ | Set-Content -Path "$InstallDir\.env" -Encoding UTF8
Push-Location $InstallDir
node --check server.js
Pop-Location
$taskName = "AngelCare Flashcards Product Vault"
$nodePath = (Get-Command node.exe).Source
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$InstallDir\server.js`"" -WorkingDirectory $InstallDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
$firewallName = "AngelCare Flashcards Vault TCP $Port"
Get-NetFirewallRule -DisplayName $firewallName -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $firewallName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Domain,Private | Out-Null
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 2
Write-Host "SUCCESS: Windows Product Vault installed." -ForegroundColor Green
Write-Host "Add these server-only values to apps/ops-web/.env.local:" -ForegroundColor Yellow
Write-Host "FLASHCARDS_OS_WINDOWS_NODE_URL=http://YOUR_WINDOWS_NODE_IP:$Port"
Write-Host "FLASHCARDS_OS_WINDOWS_NODE_ID=$NodeId"
Write-Host "FLASHCARDS_OS_WINDOWS_NODE_SECRET=$NodeSecret"
