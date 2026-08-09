param(
  [string]$SourceFile = "",
  [string]$TargetFile = "C:\AngelCare\email-bridge\server.js",
  [string]$ServiceName = "angelcare-email-bridge",
  [string]$QuarantineRoot = "C:\AngelCare\quarantine",
  [string]$CanonicalRoot = "C:\AngelCare\content-store",
  [bool]$EnableRemoteProviderDeletion = $false
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SourceFile)) { $SourceFile = Join-Path $PSScriptRoot "server.js" }
$SourceFile = [System.IO.Path]::GetFullPath($SourceFile)
$TargetFile = [System.IO.Path]::GetFullPath($TargetFile)
$QuarantineRoot = [System.IO.Path]::GetFullPath($QuarantineRoot)
$CanonicalRoot = [System.IO.Path]::GetFullPath($CanonicalRoot)
if (-not (Test-Path $SourceFile)) { throw "Patched bridge source was not found: $SourceFile" }

$RequiredContracts = @(
  '/admin/storage/inventory',
  '/admin/storage/browse',
  '/admin/storage/quarantine/impact',
  '/admin/storage/quarantine/execute',
  '/admin/storage/quarantine/restore',
  '/admin/storage/destruction/preflight',
  '/admin/storage/destruction/execute',
  '/admin/storage/destruction/status',
  '/admin/storage/destruction/verify',
  '/admin/storage/cleanup/dry-run',
  '/admin/storage/lifecycle/snapshot',
  '/admin/storage/dedup/preflight',
  '/admin/storage/dedup/execute',
  '/admin/storage/dedup/materialize',
  '/admin/storage/provider/capabilities',
  '/admin/storage/provider/reconcile'
)
$SourceContent = Get-Content -Path $SourceFile -Raw
foreach ($Contract in $RequiredContracts) {
  if (-not $SourceContent.Contains($Contract)) { throw "The selected source does not contain required Phase 5 endpoint: $Contract" }
}

$TargetDirectory = Split-Path -Parent $TargetFile
foreach ($Directory in @($TargetDirectory,$QuarantineRoot,$CanonicalRoot)) {
  if (-not (Test-Path $Directory)) { New-Item -ItemType Directory -Path $Directory -Force | Out-Null }
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDirectory = Join-Path $TargetDirectory "backups\storage-lifecycle-phase5-$Stamp"
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
if (Test-Path $TargetFile) { Copy-Item $TargetFile (Join-Path $BackupDirectory "server.js.before-storage-lifecycle-phase5") -Force }
Copy-Item $SourceFile $TargetFile -Force
& node --check $TargetFile
if ($LASTEXITCODE -ne 0) { throw "Node syntax validation failed. The service was not restarted. Backup: $BackupDirectory" }

$RemoteDeletionValue = if ($EnableRemoteProviderDeletion) { "true" } else { "false" }
[Environment]::SetEnvironmentVariable("STORAGE_QUARANTINE_ROOT", $QuarantineRoot, [EnvironmentVariableTarget]::Machine)
[Environment]::SetEnvironmentVariable("STORAGE_CANONICAL_ROOT", $CanonicalRoot, [EnvironmentVariableTarget]::Machine)
[Environment]::SetEnvironmentVariable("STORAGE_PROVIDER_REMOTE_DELETE_ENABLED", $RemoteDeletionValue, [EnvironmentVariableTarget]::Machine)

$EnvFile = Join-Path $TargetDirectory ".env"
$EnvLines = if (Test-Path $EnvFile) { @(Get-Content -Path $EnvFile -ErrorAction SilentlyContinue) } else { @() }
$FilteredLines = @($EnvLines | Where-Object {
  $_ -notmatch '^STORAGE_QUARANTINE_ROOT=' -and
  $_ -notmatch '^STORAGE_CANONICAL_ROOT=' -and
  $_ -notmatch '^STORAGE_PROVIDER_REMOTE_DELETE_ENABLED='
})
$FilteredLines += "STORAGE_QUARANTINE_ROOT=$QuarantineRoot"
$FilteredLines += "STORAGE_CANONICAL_ROOT=$CanonicalRoot"
$FilteredLines += "STORAGE_PROVIDER_REMOTE_DELETE_ENABLED=$RemoteDeletionValue"
Set-Content -Path $EnvFile -Value $FilteredLines -Encoding UTF8

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($null -eq $service) { throw "Windows service '$ServiceName' was not found. The file was updated but the service was not restarted." }
Restart-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3
$service = Get-Service -Name $ServiceName
if ($service.Status -ne "Running") { throw "The bridge service did not return to Running status. Backup: $BackupDirectory" }

Write-Host "Storage Lifecycle Phase 5 bridge update deployed successfully." -ForegroundColor Green
Write-Host "Source:             $SourceFile"
Write-Host "Target:             $TargetFile"
Write-Host "Backup:             $BackupDirectory"
Write-Host "Quarantine root:    $QuarantineRoot"
Write-Host "Canonical root:     $CanonicalRoot"
Write-Host "Remote POP delete:  $RemoteDeletionValue"
Write-Host "Service:            $ServiceName ($($service.Status))"
Write-Host "Governed Phase 1-5 endpoints:" -ForegroundColor Cyan
$RequiredContracts | ForEach-Object { Write-Host "  $_" }
Write-Host "Exact-hash deduplication requires independent approval and same-volume NTFS validation." -ForegroundColor Yellow
Write-Host "Remote provider deletion remains disabled unless explicitly enabled after provider validation." -ForegroundColor Yellow
