param(
  [string]$SourceFile = "",
  [string]$TargetFile = "C:\AngelCare\email-bridge\server.js",
  [string]$ServiceName = "angelcare-email-bridge"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourceFile)) {
  $SourceFile = Join-Path $PSScriptRoot "server.js"
}

$SourceFile = [System.IO.Path]::GetFullPath($SourceFile)
$TargetFile = [System.IO.Path]::GetFullPath($TargetFile)

if (-not (Test-Path $SourceFile)) {
  throw "Patched bridge source was not found: $SourceFile"
}

$RequiredContracts = @(
  '/admin/storage/inventory',
  '/admin/storage/browse',
  '/admin/storage/file',
  '/admin/storage/preview',
  '/admin/storage/duplicates',
  '/admin/storage/orphans'
)

$SourceContent = Get-Content -Path $SourceFile -Raw
foreach ($Contract in $RequiredContracts) {
  if (-not $SourceContent.Contains($Contract)) {
    throw "The selected source does not contain required Phase 2 endpoint: $Contract"
  }
}

$TargetDirectory = Split-Path -Parent $TargetFile
if (-not (Test-Path $TargetDirectory)) {
  New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDirectory = Join-Path $TargetDirectory "backups\storage-explorer-phase2-$Stamp"
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null

if (Test-Path $TargetFile) {
  Copy-Item $TargetFile (Join-Path $BackupDirectory "server.js.before-storage-explorer-phase2") -Force
}

Copy-Item $SourceFile $TargetFile -Force

& node --check $TargetFile
if ($LASTEXITCODE -ne 0) {
  throw "Node syntax validation failed. The service was not restarted. Backup: $BackupDirectory"
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

Write-Host "Storage Explorer Phase 2 bridge update deployed successfully." -ForegroundColor Green
Write-Host "Source:  $SourceFile"
Write-Host "Target:  $TargetFile"
Write-Host "Backup:  $BackupDirectory"
Write-Host "Service: $ServiceName ($($service.Status))"
Write-Host "Read-only endpoints:" -ForegroundColor Cyan
$RequiredContracts | ForEach-Object { Write-Host "  $_" }
