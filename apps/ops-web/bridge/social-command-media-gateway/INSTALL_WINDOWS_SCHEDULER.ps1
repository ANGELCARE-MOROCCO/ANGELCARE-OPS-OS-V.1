$ErrorActionPreference = "Stop"
$TickUrl = $env:SOCIAL_COMMAND_WORKER_TICK_URL
$WorkerSecret = $env:SOCIAL_COMMAND_WORKER_SECRET
if (-not $TickUrl -or -not $WorkerSecret) { throw "SOCIAL_COMMAND_WORKER_TICK_URL and SOCIAL_COMMAND_WORKER_SECRET are required" }
$Dir = "C:\AngelCare\SocialCommandWorker"
New-Item -ItemType Directory -Path $Dir -Force | Out-Null
$Runner = Join-Path $Dir "tick.ps1"
@"
`$ErrorActionPreference='Stop'
`$headers=@{'x-social-command-worker-secret'='$WorkerSecret'}
Invoke-RestMethod -Method Post -Uri '$TickUrl' -Headers `$headers -ContentType 'application/json' -Body '{"limit":8}' | Out-Null
"@ | Set-Content -LiteralPath $Runner -Encoding UTF8
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Runner`""
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 4) -StartWhenAvailable
Register-ScheduledTask -TaskName "AngelCare Social Command Publisher" -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null
Write-Host "SOCIAL_COMMAND_WINDOWS_SCHEDULER_INSTALLED" -ForegroundColor Green
