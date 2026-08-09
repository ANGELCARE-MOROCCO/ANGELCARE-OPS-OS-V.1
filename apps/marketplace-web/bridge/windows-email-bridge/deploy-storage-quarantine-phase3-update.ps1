param(
  [string]$SourceFile = "",
  [string]$TargetFile = "C:\AngelCare\email-bridge\server.js",
  [string]$ServiceName = "angelcare-email-bridge",
  [string]$QuarantineRoot = "C:\AngelCare\quarantine"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourceFile)) {
  $SourceFile = Join-Path $PSScriptRoot "server.js"
}

$SourceFile = [System.IO.Path]::GetFullPath($SourceFile)
$TargetFile = [System.IO.Path]::GetFullPath($TargetFile)
$QuarantineRoot = [System.IO.Path]::GetFullPath($QuarantineRoot)

if (-not (Test-Path $SourceFile)) {
  throw "Patched bridge source was not found: $SourceFile"
}

$RequiredContracts = @(
  '/admin/storage/inventory',
  '/admin/storage/browse',
  '/admin/storage/file',
  '/admin/storage/preview',
  '/admin/storage/quarantine/impact',
  '/admin/storage/quarantine/execute',
  '/admin/storage/quarantine/status',
  '/admin/storage/quarantine/restore',
  '/admin/storage/quarantine/verify'
)

$SourceContent = Get-Content -Path $SourceFile -Raw
foreach ($Contract in $RequiredContracts) {
  if (-not $SourceContent.Contains($Contract)) {
    throw "The selected source does not contain required Phase 3 endpoint: $Contract"
  }
}

$TargetDirectory = Split-Path -Parent $TargetFile
if (-not (Test-Path $TargetDirectory)) {
  New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null
}
if (-not (Test-Path $QuarantineRoot)) {
  New-Item -ItemType Directory -Path $QuarantineRoot -Force | Out-Null
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDirectory = Join-Path $TargetDirectory "backups\storage-quarantine-phase3-$Stamp"
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null

if (Test-Path $TargetFile) {
  Copy-Item $TargetFile (Join-Path $BackupDirectory "server.js.before-storage-quarantine-phase3") -Force
}

Copy-Item $SourceFile $TargetFile -Force

& node --check $TargetFile
if ($LASTEXITCODE -ne 0) {
  throw "Node syntax validation failed. The service was not restarted. Backup: $BackupDirectory"
}

# Persist the quarantine root at machine scope so the Windows service inherits it
# after restart. The bridge also keeps C:\AngelCare\quarantine as a safe default.
[Environment]::SetEnvironmentVariable(
  "STORAGE_QUARANTINE_ROOT",
  $QuarantineRoot,
  [EnvironmentVariableTarget]::Machine
)

# Keep the bridge-local .env aligned for installations whose service wrapper
# explicitly loads this file. Existing entries are replaced rather than duplicated.
$EnvFile = Join-Path $TargetDirectory ".env"
if (Test-Path $EnvFile) {
  $EnvLines = Get-Content -Path $EnvFile -ErrorAction SilentlyContinue
  $FilteredLines = @($EnvLines | Where-Object { $_ -notmatch '^STORAGE_QUARANTINE_ROOT=' })
  $FilteredLines += "STORAGE_QUARANTINE_ROOT=$QuarantineRoot"
  Set-Content -Path $EnvFile -Value $FilteredLines -Encoding UTF8
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($null -eq $service) {
  throw "Windows service '$ServiceName' was not found. The file was updated but the service was not restarted."
}

Restart-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3
$service = Get-Service -Name $ServiceName

if ($service.Status -ne "Running") {
  throw "The bridge service did not return to Running status. Backup: $BackupDirectory"
}

Write-Host "Storage Quarantine Phase 3 bridge update deployed successfully." -ForegroundColor Green
Write-Host "Source:          $SourceFile"
Write-Host "Target:          $TargetFile"
Write-Host "Backup:          $BackupDirectory"
Write-Host "Quarantine root: $QuarantineRoot"
Write-Host "Machine environment STORAGE_QUARANTINE_ROOT was updated."
Write-Host "Service:         $ServiceName ($($service.Status))"
Write-Host "Reversible Phase 3 endpoints:" -ForegroundColor Cyan
$RequiredContracts | ForEach-Object { Write-Host "  $_" }
Write-Host "Permanent deletion is not introduced by this deployment." -ForegroundColor Yellow
