param(
  [Parameter(Mandatory=$true)][string]$LifecycleUrl,
  [Parameter(Mandatory=$true)][string]$LifecycleSecret,
  [string]$TaskName = "AngelCare OPSOS Storage Lifecycle Phase 5",
  [int]$EveryMinutes = 60
)

$ErrorActionPreference = "Stop"
if ($EveryMinutes -lt 15) { throw "The lifecycle scheduler cannot run more frequently than every 15 minutes." }
if (-not $LifecycleUrl.StartsWith("https://")) { throw "LifecycleUrl must use HTTPS and point to the deployed Next.js cron endpoint." }

$ScriptRoot = "C:\AngelCare\automation"
$Runner = Join-Path $ScriptRoot "run-storage-lifecycle-phase5.ps1"
if (-not (Test-Path $ScriptRoot)) { New-Item -ItemType Directory -Path $ScriptRoot -Force | Out-Null }

$EscapedUrl = $LifecycleUrl.Replace("'", "''")
$EscapedSecret = $LifecycleSecret.Replace("'", "''")
@"
`$ErrorActionPreference = 'Stop'
`$Headers = @{ 'x-opsos-lifecycle-secret' = '$EscapedSecret' }
Invoke-RestMethod -Method Post -Uri '$EscapedUrl' -Headers `$Headers -ContentType 'application/json' -Body '{}'
"@ | Set-Content -Path $Runner -Encoding UTF8

$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`""
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null

Write-Host "Phase 5 lifecycle scheduler installed." -ForegroundColor Green
Write-Host "Task:       $TaskName"
Write-Host "Cadence:    Every $EveryMinutes minutes"
Write-Host "Endpoint:   $LifecycleUrl"
Write-Host "Runner:     $Runner"
Write-Host "The task invokes only the policy-governed dry-run/synchronization orchestrator. Phase 3/4 destructive gates remain mandatory." -ForegroundColor Yellow
